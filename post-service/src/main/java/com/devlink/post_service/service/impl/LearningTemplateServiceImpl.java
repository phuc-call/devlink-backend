package com.devlink.post_service.service.impl;


import com.devlink.post_service.client.cache.UserLanguageCacheClient;
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

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import static com.devlink.post_service.config.Constants.MAX_FILE_SIZE;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningTemplateServiceImpl implements LearningTemplateService {


    private final LearningTemplateRepository templateRepository;
    private final FileStorageService fileStorageService;
    private final GeminiModerationService geminiService;
    private final UserLanguageCacheClient userLanguageCacheClient;
    private final ObjectMapper objectMapper;
    private final UserTemplateForkRepository forkRepository;
    private final UserInteractionRepository interactionRepository;


    private final PostAsyncService postAsyncService;

    @Override
    @Transactional
    public TemplateResponse createTemplate(CreateTemplateRequest request, MultipartFile file) {

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
                log.warn("[LearningTemplate]can not content file CODE");
            }
        }

        String lang = request.getLanguage().toUpperCase().trim();
        List<String> supportedLanguages = userLanguageCacheClient.getSupportedLanguages();
        if (supportedLanguages.isEmpty() || !supportedLanguages.contains(lang)) {
            log.warn("[LearningTemplate] Language not supported: {} | supported={}", lang, supportedLanguages);
            throw new AppException(ErrorCode.TEMPLATE_LANGUAGE_NOT_SUPPORTED);
        }


        validateFileTypeMatch(file, request.getFileType());

        String fileUrl = fileStorageService.upload(file, "templates/" + lang.toLowerCase());


        LearningTemplate template = LearningTemplate.builder().title(request.getTitle()).description(request.getDescription()).language(lang).difficulty(request.getDifficulty()).fileType(request.getFileType()).fileUrl(fileUrl).fileName(file.getOriginalFilename()).fileSize(file.getSize()).content(codeContent).tags(toJson(request.getTags())).topics(toJson(request.getTopics())).status(TemplateStatus.ACTIVE).createdBy(adminId).build();

        LearningTemplate saved = templateRepository.save(template);
        log.info("[LearningTemplate] Created id={} lang={} type={}", saved.getId(), lang, request.getFileType());

        // Async: extract text + AI summary (chỉ PDF / DOCX)
        if (request.getFileType() == TemplateFileType.PDF || request.getFileType() == TemplateFileType.DOCX) {
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

            final String aiSummary = (extractedText != null && !extractedText.isBlank()) ? geminiService.summarizeFileContent(extractedText) : null;

            templateRepository.findById(templateId).ifPresent(t -> {
                t.setExtractedText(extractedText);
                t.setAiSummary(aiSummary);
                templateRepository.save(t);
                log.info("[LearningTemplate] Async done id={} summaryLen={}", templateId, aiSummary != null ? aiSummary.length() : 0);
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
        return TemplateResponse.builder().id(t.getId()).title(t.getTitle()).description(t.getDescription()).language(t.getLanguage()).difficulty(t.getDifficulty()).fileType(t.getFileType()).fileUrl(t.getFileUrl()).fileName(t.getFileName()).fileSize(t.getFileSize()).aiSummary(t.getAiSummary()).tags(tags != null ? tags : fromJson(t.getTags())).topics(topics != null ? topics : fromJson(t.getTopics())).viewCount(t.getViewCount()).forkCount(t.getForkCount()).status(t.getStatus()).createdBy(t.getCreatedBy()).createdAt(t.getCreatedAt()).build();
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
        dto.setDifficultly(Arrays.stream(Difficulty.values()).map(Enum::name).toList());
        dto.setFileType(Arrays.stream(FileType.values()).map(Enum::name).toList());
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TemplateCardResponse> getMyTemplates(int page, int size, Difficulty difficulty, String tag) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<String> languages = userLanguageCacheClient.getUserLanguages(userId);

        if (languages.isEmpty()) {
            return PagedResponse.empty("Bạn chưa cài đặt ngôn ngữ lập trình. Hãy cập nhật profile để xem template phù hợp.");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<TemplateCardResponse> result = templateRepository.findTemplates(userId, List.of(TemplateStatus.ACTIVE), languages, difficulty, tag, pageable);

        return PagedResponse.of(result);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TemplateCardResponse> getTemplates(int page, int size, Difficulty difficulty, String tag, TemplateStatus status) {
        Pageable pageable = PageRequest.of(page, size);
        List<String> allLanguages = userLanguageCacheClient.getSupportedLanguages();

        List<TemplateStatus> statuses = (status != null) ? List.of(status) : List.of(TemplateStatus.ACTIVE, TemplateStatus.HIDDEN);

        Page<TemplateCardResponse> result = templateRepository.getTemplatesForAdmin(statuses, allLanguages, difficulty, tag, pageable);
        return PagedResponse.of(result);
    }

    @Override
    @Transactional
    public TemplateDetailResponse getTemplateDetail(Long templateId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        LearningTemplate template = templateRepository.findByIdAndStatus(templateId, TemplateStatus.ACTIVE).orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));


        interactionRepository.save(UserInteraction.builder().userId(currentUserId).targetId(templateId).targetType(TargetType.TEMPLATE).action(ActionType.VIEW).build());


        Optional<UserTemplateFork> forkOpt = forkRepository.findByUserIdAndTemplateId(currentUserId, templateId);

        ForkInfoResponse forkInfo = forkOpt.map(fork -> ForkInfoResponse.builder().forkId(fork.getId()).isModified(fork.getIsModified()).lastEditedAt(fork.getLastEditedAt()).createdAt(fork.getCreatedAt()).build()).orElse(null);

        return TemplateDetailResponse.builder().id(template.getId()).title(template.getTitle()).description(template.getDescription()).language(template.getLanguage()).difficulty(template.getDifficulty()).fileType(template.getFileType()).fileUrl(template.getFileUrl()).fileName(template.getFileName()).fileSize(template.getFileSize()).content(template.getContent()).aiSummary(template.getAiSummary()).tags(template.getTags()).topics(template.getTopics()).viewCount(template.getViewCount()).forkCount(template.getForkCount()).createdBy(template.getCreatedBy()).createdAt(template.getCreatedAt()).updatedAt(template.getUpdatedAt()).forkInfo(forkInfo).status(template.getStatus()).build();
    }

    @Override
    @Transactional
    public ForkResponse forkTemplate(Long templateId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        //Validate template tồn tại và ACTIVE
        LearningTemplate template = templateRepository.findByIdAndStatus(templateId, TemplateStatus.ACTIVE).orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));


        if (template.getFileType() == TemplateFileType.VIDEO) {
            throw new AppException(ErrorCode.FORK_NOT_ALLOWED);
        }

        // Đã fork rồi, trả về fork cũ, không tạo mới
        Optional<UserTemplateFork> existingFork = forkRepository.findByUserIdAndTemplateId(currentUserId, templateId);

        if (existingFork.isPresent()) {
            UserTemplateFork fork = existingFork.get();
            return ForkResponse.builder().forkId(fork.getId()).templateId(templateId).title(fork.getTitle()).isModified(fork.getIsModified()).build();
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
                .isProposed(false)
                .isModified(false)
                .build();

        UserTemplateFork saved = forkRepository.save(newFork);


        templateRepository.incrementForkCount(templateId);

        return ForkResponse.builder().forkId(saved.getId()).templateId(templateId).title(saved.getTitle()).isModified(false).build();
    }

    @Override
    public void updateTemplateStatus(Long templateId, TemplateStatus newStatus) {
        LearningTemplate learningTemplate = templateRepository.findById(templateId).orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));

        if (!newStatus.isValidTransitionFrom(learningTemplate.getStatus())) {
            throw new AppException(ErrorCode.INVALID_TEMPLATE_TYPE);
        }
        if (newStatus.equals(TemplateStatus.DELETED)) {
            templateRepository.deleteById(templateId);
            return;
        }
        learningTemplate.setStatus(newStatus);
        templateRepository.save(learningTemplate);
    }

    @Override
    @Transactional
    public TemplateResponse updateTemplate(Long templateId, CreateTemplateRequest request, MultipartFile file) {
        LearningTemplate learningTemplate = templateRepository.findById(templateId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));

        processTemplateFileUpdate(learningTemplate, request, file);
        updateBasicInformation(learningTemplate, request);
        updateLanguageAndMetadata(learningTemplate, request);

        LearningTemplate updatedTemplate = templateRepository.save(learningTemplate);
        log.info("[LearningTemplate] Updated success id={}", updatedTemplate.getId());

        return toResponse(updatedTemplate, request.getTags(), request.getTopics());
    }

    private void processTemplateFileUpdate(LearningTemplate learningTemplate, CreateTemplateRequest request, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.TEMPLATE_FILE_TOO_LARGE);
        }

        String langForFile = (request.getLanguage() != null && !request.getLanguage().trim().isEmpty())
                ? request.getLanguage().toUpperCase().trim()
                : learningTemplate.getLanguage();

        TemplateFileType fileTypeForValidate = (request.getFileType() != null)
                ? request.getFileType()
                : learningTemplate.getFileType();

        validateFileTypeMatch(file, fileTypeForValidate);

        String fileUrl = fileStorageService.upload(file, "templates/" + langForFile.toLowerCase());
        learningTemplate.setFileUrl(fileUrl);
        learningTemplate.setFileName(file.getOriginalFilename());
        learningTemplate.setFileSize(file.getSize());

        handleFileContentByFileType(learningTemplate, file, fileUrl, fileTypeForValidate);
    }

    private void handleFileContentByFileType(LearningTemplate learningTemplate, MultipartFile file, String fileUrl, TemplateFileType fileType) {
        if (fileType == TemplateFileType.CODE) {
            try {
                String codeContent = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
                learningTemplate.setContent(codeContent);
            } catch (Exception e) {
                log.warn("[LearningTemplate] Không đọc được content file CODE khi update id={}", learningTemplate.getId());
            }
        } else if (fileType == TemplateFileType.PDF || fileType == TemplateFileType.DOCX) {
            postAsyncService.extractAndSummarizeTemplate(learningTemplate.getId(), fileUrl, fileType);
        }
    }

    private void updateBasicInformation(LearningTemplate learningTemplate, CreateTemplateRequest request) {
        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            learningTemplate.setTitle(request.getTitle().trim());
        }

        if (request.getDescription() != null && !request.getDescription().trim().isEmpty()) {
            learningTemplate.setDescription(request.getDescription().trim());
        }

        if (request.getDifficulty() != null) {
            learningTemplate.setDifficulty(request.getDifficulty());
        }

        if (request.getFileType() != null) {
            learningTemplate.setFileType(request.getFileType());
        }
    }

    private void updateLanguageAndMetadata(LearningTemplate learningTemplate, CreateTemplateRequest request) {
        if (request.getLanguage() != null && !request.getLanguage().trim().isEmpty()) {
            String lang = request.getLanguage().toUpperCase().trim();
            List<String> supportedLanguages = userLanguageCacheClient.getSupportedLanguages();
            if (supportedLanguages.isEmpty() || !supportedLanguages.contains(lang)) {
                log.warn("[LearningTemplate] Language not supported during update: {} | supported={}", lang, supportedLanguages);
                throw new AppException(ErrorCode.TEMPLATE_LANGUAGE_NOT_SUPPORTED);
            }
            learningTemplate.setLanguage(lang);
        }

        if (request.getTags() != null && !request.getTags().isEmpty()) {
            learningTemplate.setTags(toJson(request.getTags()));
        }

        if (request.getTopics() != null && !request.getTopics().isEmpty()) {
            learningTemplate.setTopics(toJson(request.getTopics()));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public OverviewOfTemplate getOverviewData(Instant startDate, Instant endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate))
            throw new AppException(ErrorCode.INVALID_DATE_RANGE);

        Instant[] range = resolveRange(startDate, endDate);
        Instant start = range[0];
        Instant end = range[1];

        LocalDateTime startLocal = toLocalUTC(start);
        LocalDateTime endLocal = toLocalUTC(end);

        List<TemplateStatsProjectionResponse> stats = templateRepository.findStatsBetween(start, end);
        List<TemplateOverviewItemResponse> rawItems = templateRepository.findOverviewItemsBetween(start, end);
        Map<Long, Long> forkMap = buildForkMap(forkRepository.countForksByTemplateIdBetween(startLocal, endLocal));
        List<TemplateOverviewItemResponse> items = mergeWithForkCount(rawItems, forkMap);

        return buildOverview(stats, items, start, end);
    }


    private Instant[] resolveRange(Instant start, Instant end) {
        if (start == null || end == null) {
            Instant now = Instant.now();
            return new Instant[]{now.minus(30, ChronoUnit.DAYS), now};
        }
        return new Instant[]{start, end};
    }

    private LocalDateTime toLocalUTC(Instant instant) {
        return LocalDateTime.ofInstant(instant, ZoneId.of("UTC"));
    }

    private Map<Long, Long> buildForkMap(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(
                r -> (Long) r[0],
                r -> (Long) r[1]
        ));
    }

    private List<TemplateOverviewItemResponse> mergeWithForkCount(
            List<TemplateOverviewItemResponse> items, Map<Long, Long> forkMap) {
        return items.stream()
                .map(t -> t.toBuilder()
                        .forkCount(forkMap.getOrDefault(t.getId(), 0L))
                        .build())
                .sorted(Comparator.comparingLong(TemplateOverviewItemResponse::getViewCount).reversed())
                .toList();
    }

    private OverviewOfTemplate buildOverview(
            List<TemplateStatsProjectionResponse> stats,
            List<TemplateOverviewItemResponse> items,
            Instant start, Instant end) {

        long hidden = 0;
        long active = 0;
        long watch = 0;
        Map<String, Long> byLanguage = new HashMap<>();
        Map<String, Long> byFileType = new HashMap<>();
        Map<String, Long> byDifficulty = new HashMap<>();

        for (TemplateStatsProjectionResponse s : stats) {
            if (s.getStatus() == TemplateStatus.HIDDEN) hidden += s.getCount();
            if (s.getStatus() == TemplateStatus.ACTIVE) active += s.getCount();
            watch += s.getTotalViews() != null ? s.getTotalViews() : 0;
            byLanguage.merge(s.getLanguage(), s.getCount(), Long::sum);
            byFileType.merge(s.getFileType().name(), s.getCount(), Long::sum);
            byDifficulty.merge(s.getDifficulty().name(), s.getCount(), Long::sum);
        }

        return OverviewOfTemplate.builder()
                .overviewHidden(hidden)
                .overviewAction(active)
                .overviewTemplate(stats.stream().mapToLong(TemplateStatsProjectionResponse::getCount).sum())
                .overviewFork(items.stream().mapToLong(TemplateOverviewItemResponse::getForkCount).sum())
                .overviewWatch(watch)
                .overviewFileType((long) byFileType.size())
                .overviewOldDate(start)
                .overviewNewDate(end)
                .byLanguage(byLanguage)
                .byFileType(byFileType)
                .byDifficulty(byDifficulty)
                .items(items)
                .build();
    }
}