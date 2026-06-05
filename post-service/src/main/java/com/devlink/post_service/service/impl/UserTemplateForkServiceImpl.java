package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.request.UpdateForkRequest;
import com.devlink.post_service.dto.response.ForkDetailResponse;
import com.devlink.post_service.dto.response.ForkResponse;
import com.devlink.post_service.entity.LearningTemplate;
import com.devlink.post_service.entity.UserTemplateFork;
import com.devlink.post_service.entity.enums.TemplateFileType;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.LearningTemplateRepository;
import com.devlink.post_service.repository.UserTemplateForkRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.UserTemplateForkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserTemplateForkServiceImpl implements UserTemplateForkService {
    private final UserTemplateForkRepository forkRepository;
    private final LearningTemplateRepository learningTemplateRepository;
    private final PostAsyncService postAsyncService; // inject
    private final LearningTemplateRepository templateRepository;
    @Value("${minio.endpoint}")
    private String minioInternalEndpoint; // http://minio:9000

    @Value("${minio.public-endpoint}")
    private String minioPublicEndpoint;

    @Override
    public ForkResponse updateFork(Long forkId, UpdateForkRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        UserTemplateFork fork = forkRepository.findById(forkId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_FORK_NOT_FOUND));

        if (!fork.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        LearningTemplate template = learningTemplateRepository
                .findById(fork.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));

        if (template.getFileType() == TemplateFileType.CODE
                && (request.getContent() == null || request.getContent().isBlank())) {
            throw new AppException(ErrorCode.POST_CONTENT_EMPTY);
        }


        if (request.getContent() != null) {
            fork.setContent(request.getContent());
        }
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            fork.setTitle(request.getTitle());
        }
        fork.setIsModified(true);
        fork.setLastEditedAt(LocalDateTime.now());

        UserTemplateFork saved = forkRepository.save(fork);

        return ForkResponse.builder()
                .forkId(saved.getId())
                .templateId(saved.getTemplateId())
                .title(saved.getTitle())
                .isModified(saved.getIsModified())
                .build();
    }


    @Override
    @Transactional(readOnly = true)
    public ForkDetailResponse getForkDetail(Long forkId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        UserTemplateFork fork = forkRepository.findById(forkId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_FORK_NOT_FOUND));

        if (!fork.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String content = fork.getContent();
        if (content == null && fork.getFileUrl() != null) {
            LearningTemplate template = learningTemplateRepository
                    .findById(fork.getTemplateId())
                    .orElse(null);

            TemplateFileType fileType = (template != null)
                    ? template.getFileType()
                    : TemplateFileType.DOCX;

            // Đổi public URL internal URL để container đọc được
            String internalUrl = fork.getFileUrl()
                    .replace(minioPublicEndpoint, minioInternalEndpoint);

            log.info("[getForkDetail] forkId={} fileType={} url={}", forkId, fileType, internalUrl);
            content = postAsyncService.extractText(internalUrl, fileType);
            log.info("[getForkDetail] forkId={} content={}", forkId, content != null ? "OK" : "NULL");
        }

        return ForkDetailResponse.builder()
                .id(fork.getId())
                .templateId(fork.getTemplateId())
                .title(fork.getTitle())
                .content(content)
                .fileUrl(fork.getFileUrl())
                .isModified(fork.getIsModified())
                .lastEditedAt(fork.getLastEditedAt())
                .createdAt(fork.getCreatedAt())
                .build();
    }

    @Override
    public ForkResponse resetFork(Long forkId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        UserTemplateFork fork = forkRepository.findById(forkId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_FORK_NOT_FOUND));

        if (!fork.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.TEMPLATE_FORK_NOT_OWNER);
        }
        //get original content from the original template
        LearningTemplate template = templateRepository.findById(fork.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));

        fork.setContent(template.getContent());
        fork.setIsModified(false);
        fork.setLastEditedAt(LocalDateTime.now());
        UserTemplateFork saved = forkRepository.save(fork);
        return ForkResponse.builder()
                .forkId(saved.getId())
                .isModified(saved.getIsModified())
                .templateId(saved.getTemplateId())
                .title(saved.getTitle())
                .build();
    }

    @Override
    public List<ForkResponse> getMyForks() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<ForkResponse> responses = forkRepository.findForkOfCurrentUser(userId);
        if (responses.isEmpty()) {
            return List.of();
        }
        return responses;
    }

}