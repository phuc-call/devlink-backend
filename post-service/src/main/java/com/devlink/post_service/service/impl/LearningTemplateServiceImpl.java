package com.devlink.post_service.service.impl;

import com.devlink.post_service.client.UserInfoCacheClient;
import com.devlink.post_service.dto.request.CreateTemplateRequest;
import com.devlink.post_service.dto.response.TemplateResponse;
import com.devlink.post_service.entity.LearningTemplate;
import com.devlink.post_service.entity.enums.TemplateFileType;
import com.devlink.post_service.entity.enums.TemplateStatus;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.LearningTemplateRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.FileStorageService;
import com.devlink.post_service.service.GeminiModerationService;
import com.devlink.post_service.service.LearningTemplateService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningTemplateServiceImpl implements LearningTemplateService {

    private static final long MAX_FILE_SIZE = 100L * 1024 * 1024; // 100 MB

    private final LearningTemplateRepository templateRepository;
    private final FileStorageService fileStorageService;
    private final GeminiModerationService geminiService;
    private final UserInfoCacheClient userInfoCacheClient;
    private final ObjectMapper objectMapper;


    private final PostAsyncService postAsyncService;
    @Override
    @Transactional
    public TemplateResponse createTemplate(CreateTemplateRequest request,
                                           MultipartFile file) {

        Long adminId=SecurityUtils.getCurrentUserId();
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.POST_FILE_EMPTY);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.TEMPLATE_FILE_TOO_LARGE);
        }

        String lang = request.getLanguage().toUpperCase().trim();
        List<String> supportedLanguages = userInfoCacheClient.getSupportedLanguages();
        if (supportedLanguages.isEmpty() || !supportedLanguages.contains(lang)) {
            log.warn("[LearningTemplate] Language not supported: {} | supported={}", lang, supportedLanguages);
            throw new AppException(ErrorCode.TEMPLATE_LANGUAGE_NOT_SUPPORTED);
        }


        validateFileTypeMatch(file,request.getFileType());

        String fileUrl = fileStorageService.upload(file, "templates/" + lang.toLowerCase());


        LearningTemplate template = LearningTemplate.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .language(lang)
                .difficulty(request.getDifficulty())
                .fileType(request.getFileType())
                .fileUrl(fileUrl)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .tags(toJson(request.getTags()))
                .topics(toJson(request.getTopics()))
                .status(TemplateStatus.ACTIVE)
                .createdBy(adminId)
                .build();

        LearningTemplate saved = templateRepository.save(template);
        log.info("[LearningTemplate] Created id={} lang={} type={}", saved.getId(), lang, request.getFileType());

        // Async: extract text + AI summary (chỉ PDF / DOCX)
        if (request.getFileType() == TemplateFileType.PDF
                || request.getFileType() == TemplateFileType.DOCX) {
            postAsyncService.extractAndSummarizeTemplate(saved.getId(), fileUrl, request.getFileType());

        }

        return toResponse(saved, request.getTags(), request.getTopics());
    }


    // Async: Extract text + tạo AI summary update DB
    @Async
    @Transactional
    public void extractAndSummarizeAsync(Long templateId, String fileUrl, TemplateFileType fileType) {
        log.info("[LearningTemplate] Async extract start id={}", templateId);
        try {
            String extractedText = extractText(fileUrl, fileType);

            final String aiSummary = (extractedText != null && !extractedText.isBlank())
                    ? geminiService.summarizeFileContent(extractedText)
                    : null;

            templateRepository.findById(templateId).ifPresent(t -> {
                t.setExtractedText(extractedText);
                t.setAiSummary(aiSummary);
                templateRepository.save(t);
                log.info("[LearningTemplate] Async done id={} summaryLen={}",
                        templateId, aiSummary != null ? aiSummary.length() : 0);
            });
        } catch (Exception e) {
            log.error("[LearningTemplate] Async extract failed id={}", templateId, e);
        }
    }


    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }

    private String extractText(String fileUrl, TemplateFileType fileType) {
        // TODO: implement với Apache Tika
        log.info("[LearningTemplate] extractText placeholder url={}", fileUrl);
        return null;
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return null;
        }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private TemplateResponse toResponse(LearningTemplate t, List<String> tags, List<String> topics) {
        return TemplateResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .language(t.getLanguage())
                .difficulty(t.getDifficulty())
                .fileType(t.getFileType())
                .fileUrl(t.getFileUrl())
                .fileName(t.getFileName())
                .fileSize(t.getFileSize())
                .aiSummary(t.getAiSummary())
                .tags(tags != null ? tags : fromJson(t.getTags()))
                .topics(topics != null ? topics : fromJson(t.getTopics()))
                .viewCount(t.getViewCount())
                .forkCount(t.getForkCount())
                .status(t.getStatus())
                .createdBy(t.getCreatedBy())
                .createdAt(t.getCreatedAt())
                .build();
    }
    private static final Map<TemplateFileType, Set<String>> TYPE_TO_EXT = Map.of(
            TemplateFileType.PDF,   Set.of(".pdf"),
            TemplateFileType.DOCX,  Set.of(".docx", ".doc"),
            TemplateFileType.XLSX,  Set.of(".xlsx", ".xls"),
            TemplateFileType.VIDEO, Set.of(".mp4", ".mov", ".avi"),
            TemplateFileType.CODE,  Set.of()
    );
    private void validateFileTypeMatch(MultipartFile file, TemplateFileType declared) {
        if (declared == TemplateFileType.CODE) return;
        String ext = extractExtension(file.getOriginalFilename());
        Set<String> allowed = TYPE_TO_EXT.getOrDefault(declared, Set.of());
        if (!allowed.contains(ext)) {
            throw new AppException(ErrorCode.TEMPLATE_FILE_TYPE_MISMATCH);
        }
    }
}