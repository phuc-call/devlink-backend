package com.devlink.post_service.service.impl;

import com.devlink.post_service.client.UserInfoCacheClient;
import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.request.CreateTemplateRequest;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.LearningTemplate;
import com.devlink.post_service.entity.UserInteraction;
import com.devlink.post_service.entity.UserTemplateFork;
import com.devlink.post_service.entity.enums.*;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.LearningTemplateRepository;
import com.devlink.post_service.repository.UserInteractionRepository;
import com.devlink.post_service.repository.UserTemplateForkRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.FileStorageService;
import com.devlink.post_service.service.GeminiModerationService;
import com.devlink.post_service.service.LearningTemplateService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
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
    private final UserTemplateForkRepository forkRepository;
    private final UserInteractionRepository interactionRepository;


    private final PostAsyncService postAsyncService;

    @Override
    @Transactional
    public TemplateResponse createTemplate(CreateTemplateRequest request,
                                           MultipartFile file) {

        Long adminId = SecurityUtils.getCurrentUserId();
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.POST_FILE_EMPTY);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.TEMPLATE_FILE_TOO_LARGE);
        }

        String codeContent = null;
        if (request.getFileType() == TemplateFileType.CODE) {
            try {
                codeContent = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
            } catch (Exception e) {
                log.warn("[LearningTemplate] Không đọc được content file CODE");
            }
        }

        String lang = request.getLanguage().toUpperCase().trim();
        List<String> supportedLanguages = userInfoCacheClient.getSupportedLanguages();
        if (supportedLanguages.isEmpty() || !supportedLanguages.contains(lang)) {
            log.warn("[LearningTemplate] Language not supported: {} | supported={}", lang, supportedLanguages);
            throw new AppException(ErrorCode.TEMPLATE_LANGUAGE_NOT_SUPPORTED);
        }


        validateFileTypeMatch(file, request.getFileType());

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
                .content(codeContent)
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
            return objectMapper.readValue(json, new TypeReference<>() {
            });
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


    private void validateFileTypeMatch(MultipartFile file, TemplateFileType declared) {
        if (declared == TemplateFileType.CODE) return;
        String ext = extractExtension(file.getOriginalFilename());
        Set<String> allowed = Constants.TYPE_TO_EXT.getOrDefault(declared, Set.of());
        if (!allowed.contains(ext)) {
            throw new AppException(ErrorCode.TEMPLATE_FILE_TYPE_MISMATCH);
        }
    }

    @Override
    public TemplateFileTyeAndDifficultlyResponse getFileTypeAndDifficulty() {
        TemplateFileTyeAndDifficultlyResponse dto = new TemplateFileTyeAndDifficultlyResponse();
        dto.setDifficultly(Arrays.stream(Difficulty.values())
                .map(Enum::name).toList());
        dto.setFileType(Arrays.stream(FileType.values())
                .map(Enum::name).toList());
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TemplateCardResponse> getMyTemplates(int page, int size,
                                                              Difficulty difficulty, String tag) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<String> languages = userInfoCacheClient.getUserLanguages(userId);

        if (languages.isEmpty()) {
            return PagedResponse.empty(
                    "Bạn chưa cài đặt ngôn ngữ lập trình. Hãy cập nhật profile để xem template phù hợp."
            );
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<TemplateCardResponse> result = templateRepository
                .findTemplates(userId, List.of(TemplateStatus.ACTIVE), languages, difficulty, tag, pageable);

        return PagedResponse.of(result);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TemplateCardResponse> getTemplates(int page, int size,
                                                            Difficulty difficulty, String tag) {
        Pageable pageable = PageRequest.of(page, size);
        List<String> allLanguages = userInfoCacheClient.getSupportedLanguages();
        Page<TemplateCardResponse> result = templateRepository.getTemplatesForAdmin(
                List.of(TemplateStatus.ACTIVE, TemplateStatus.DELETED, TemplateStatus.DELETED), allLanguages, difficulty, tag, pageable);
        return PagedResponse.of(result);
    }

    @Override
    @Transactional
    public TemplateDetailResponse getTemplateDetail(Long templateId) {
        Long currentUserId= SecurityUtils.getCurrentUserId();
        LearningTemplate template = templateRepository
                .findByIdAndStatus(templateId, TemplateStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));


        interactionRepository.save(
                UserInteraction.builder()
                        .userId(currentUserId)
                        .targetId(templateId)
                        .targetType(TargetType.TEMPLATE)
                        .action(ActionType.VIEW)
                        .build()
        );


        Optional<UserTemplateFork> forkOpt =
                forkRepository.findByUserIdAndTemplateId(currentUserId, templateId);

        ForkInfoResponse forkInfo = forkOpt.map(fork -> ForkInfoResponse.builder()
                .forkId(fork.getId())
                .isModified(fork.getIsModified())
                .lastEditedAt(fork.getLastEditedAt())
                .createdAt(fork.getCreatedAt())
                .build()
        ).orElse(null);

        return TemplateDetailResponse.builder()
                .id(template.getId())
                .title(template.getTitle())
                .description(template.getDescription())
                .language(template.getLanguage())
                .difficulty(template.getDifficulty())
                .fileType(template.getFileType())
                .fileUrl(template.getFileUrl())
                .fileName(template.getFileName())
                .fileSize(template.getFileSize())
                .content(template.getContent())
                .aiSummary(template.getAiSummary())
                .tags(template.getTags())
                .topics(template.getTopics())
                .viewCount(template.getViewCount())
                .forkCount(template.getForkCount())
                .createdBy(template.getCreatedBy())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .forkInfo(forkInfo)
                .status(template.getStatus())
                .build();
    }

    @Override
    @Transactional
    public ForkResponse forkTemplate(Long templateId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        //Validate template tồn tại và ACTIVE
        LearningTemplate template = templateRepository
                .findByIdAndStatus(templateId, TemplateStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));


        if (template.getFileType() == TemplateFileType.VIDEO) {
            throw new AppException(ErrorCode.FORK_NOT_ALLOWED);
        }

        // Đã fork rồi, trả về fork cũ, không tạo mới
        Optional<UserTemplateFork> existingFork =
                forkRepository.findByUserIdAndTemplateId(currentUserId, templateId);

        if (existingFork.isPresent()) {
            UserTemplateFork fork = existingFork.get();
            return ForkResponse.builder()
                    .forkId(fork.getId())
                    .templateId(templateId)
                    .title(fork.getTitle())
                    .isModified(fork.getIsModified())
                    .build();
        }

        // Tạo fork mới theo fileType
        String forkContent = null;
        String forkFileUrl = null;

        if (template.getFileType() == TemplateFileType.CODE) {
            // CODE copy content text
            forkContent = template.getContent();
        } else {
            // PDF / DOCX / XLSX  lưu reference URL, content = null
            forkFileUrl = template.getFileUrl();
        }

        UserTemplateFork newFork = UserTemplateFork.builder()
                .userId(currentUserId)
                .templateId(templateId)
                .title(template.getTitle())
                .content(forkContent)
                .fileUrl(forkFileUrl)
                .isModified(false)
                .build();

        UserTemplateFork saved = forkRepository.save(newFork);


        templateRepository.incrementForkCount(templateId);

        return ForkResponse.builder()
                .forkId(saved.getId())
                .templateId(templateId)
                .title(saved.getTitle())
                .isModified(false)
                .build();
    }

    @Override
    public void updateTemplateStatus(Long templateId, TemplateStatus newStatus){
        LearningTemplate learningTemplate = templateRepository.findById(templateId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));

        if(!newStatus.isValidTransitionFrom(learningTemplate.getStatus())){
            throw new AppException(ErrorCode.INVALID_TEMPLATE_TYPE);
        }
        if(newStatus.equals(TemplateStatus.DELETED)){
            templateRepository.deleteById(templateId);
            return;
        }
        learningTemplate.setStatus(newStatus);
        templateRepository.save(learningTemplate);
    }
}