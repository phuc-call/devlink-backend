package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.request.CreateSuggestionRequest;
import com.devlink.post_service.dto.request.RejectSuggestionRequest;
import com.devlink.post_service.dto.response.SuggestionActionResponse;
import com.devlink.post_service.dto.response.SuggestionDetailResponse;
import com.devlink.post_service.dto.response.SuggestionResponse;
import com.devlink.post_service.dto.response.SuggestionSummary;
import com.devlink.post_service.entity.LearningTemplate;
import com.devlink.post_service.entity.TemplateSuggestion;
import com.devlink.post_service.entity.UserTemplateFork;
import com.devlink.post_service.entity.enums.SuggestionStatus;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.LearningTemplateRepository;
import com.devlink.post_service.repository.TemplateSuggestionRepository;
import com.devlink.post_service.repository.UserTemplateForkRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.SuggestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional
@Slf4j @RequiredArgsConstructor
public class SuggestionServiceImpl implements SuggestionService {
    private final UserTemplateForkRepository userTemplateForkRepository;
    private final TemplateSuggestionRepository templateSuggestionRepository;
    private final LearningTemplateRepository learningTemplateRepository;
    @Override
    public SuggestionResponse createSuggestion(CreateSuggestionRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();

        UserTemplateFork fork = userTemplateForkRepository
                .findForkStatusByUserIdAndTemplateId(userId, request.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_FORK_NOT_FOUND));

        if (Boolean.FALSE.equals(fork.getIsModified())) {
            throw new AppException(ErrorCode.TEMPLATE_FORK_NO_CHANGES);
        }


        fork.setIsProposed(true);
        fork.setProposedAt(Instant.now());
        userTemplateForkRepository.save(fork);

        //if had suggestion will update
        TemplateSuggestion suggestion = templateSuggestionRepository
                .findByUserIdAndTemplateIdAndStatus(userId, request.getTemplateId(), SuggestionStatus.PENDING)
                .orElse(TemplateSuggestion.builder()
                        .templateId(request.getTemplateId())
                        .userId(userId)
                        .build());

        suggestion.setSuggestionType(request.getSuggestionType());
        suggestion.setDescription(request.getDescription());

        suggestion.setStatus(SuggestionStatus.PENDING);

        suggestion = templateSuggestionRepository.save(suggestion);

        return SuggestionResponse.builder()
                .id(suggestion.getId())
                .templateId(suggestion.getTemplateId())
                .userId(suggestion.getUserId())
                .suggestionType(suggestion.getSuggestionType())
                .description(suggestion.getDescription())

                .status(suggestion.getStatus())
                .createdAt(suggestion.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SuggestionSummary> getAllPendingForAdmin(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return templateSuggestionRepository.findAllPendingForAdmin(pageable);
    }

    @Override
    public SuggestionDetailResponse getSuggestionDetail(Long suggestionId, boolean showInfoStatus) {

        TemplateSuggestion suggestion = templateSuggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_SUGGESTION_NOT_FOUND));

        if (showInfoStatus && suggestion.getStatus() == SuggestionStatus.PENDING) {
            suggestion.setStatus(SuggestionStatus.REVIEWING);
            suggestion.setReviewedAt(Instant.now());
            suggestion.setReviewedBy(SecurityUtils.getCurrentUserId());

        }


        return userTemplateForkRepository
                .findForkStatusByUserIdAndTemplateId(suggestion.getUserId(), suggestion.getTemplateId())
                .map(fork -> mapToResponse(suggestion, fork)) // if had fork
                .orElseGet(() -> mapToResponse(suggestion, null)); // if not had fork
    }


    private SuggestionDetailResponse mapToResponse(TemplateSuggestion suggestion, UserTemplateFork fork) {
        return SuggestionDetailResponse.builder()
                .id(suggestion.getId())
                .templateId(suggestion.getTemplateId())
                .userId(suggestion.getUserId())
                .suggestionType(suggestion.getSuggestionType())
                .description(suggestion.getDescription())

                .status(suggestion.getStatus())
                .createdAt(suggestion.getCreatedAt())
                .forkId(fork != null ? fork.getId() : null)
                .forkTitle(fork != null ? fork.getTitle() : null)
                .forkContent(fork != null ? fork.getContent() : null)
                .forkFileUrl(fork != null ? fork.getFileUrl() : null)
                .forkLastEditedAt(fork != null ? fork.getProposedAt() : null)
                .build();
    }


    @Override
    @Transactional
    public SuggestionActionResponse approveSuggestion(Long suggestionId) {
        Long adminId = SecurityUtils.getCurrentUserId();


        TemplateSuggestion suggestion = templateSuggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_SUGGESTION_NOT_FOUND));


        if (suggestion.getStatus() != SuggestionStatus.PENDING && suggestion.getStatus() != SuggestionStatus.REVIEWING) {
            throw new AppException(ErrorCode.SUGGESTION_ALREADY_PROCESSED);
        }


        LearningTemplate template = learningTemplateRepository.findById(suggestion.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));

        UserTemplateFork fork = userTemplateForkRepository
                .findForkStatusByUserIdAndTemplateId(suggestion.getUserId(), suggestion.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_FORK_NOT_FOUND));

        template.setTitle(fork.getTitle());
        template.setUpdatedBy(adminId);



        if (fork.getFileUrl() != null) {
            template.setFileUrl(fork.getFileUrl());
        }

        suggestion.setStatus(SuggestionStatus.APPROVED);
        suggestion.setReviewedAt(Instant.now());
        suggestion.setReviewedBy(adminId);


        fork.setIsProposed(false);
        fork.setProposedAt(null);
        fork.setIsModified(false);

        log.info("Admin {} APPROVED and MERGE success Suggestion ID {}", adminId, suggestionId);

        return SuggestionActionResponse.builder()
                .id(suggestion.getId())
                .status(suggestion.getStatus())
                .reviewedAt(suggestion.getReviewedAt())
                .reviewedBy(suggestion.getReviewedBy())
                .build();
    }

    @Override
    @Transactional
    public SuggestionActionResponse rejectSuggestion(Long suggestionId, RejectSuggestionRequest request) {
        Long adminId = SecurityUtils.getCurrentUserId();

        if (request == null || request.getRejectReason() == null || request.getRejectReason().trim().isEmpty()) {
            throw new AppException(ErrorCode.REJECT_REASON_REQUIRED);
        }


        TemplateSuggestion suggestion = templateSuggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_SUGGESTION_NOT_FOUND));

        if (suggestion.getStatus() != SuggestionStatus.PENDING && suggestion.getStatus() != SuggestionStatus.REVIEWING) {
            throw new AppException(ErrorCode.SUGGESTION_ALREADY_PROCESSED);
        }

        UserTemplateFork fork = userTemplateForkRepository
                .findForkStatusByUserIdAndTemplateId(suggestion.getUserId(), suggestion.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_FORK_NOT_FOUND));

        suggestion.setStatus(SuggestionStatus.REJECTED);
        suggestion.setAdminNote(request.getRejectReason());
        suggestion.setReviewedAt(Instant.now());
        suggestion.setReviewedBy(adminId);

        fork.setIsProposed(false);
        fork.setProposedAt(null);

        log.info("Admin {} REJECTED Suggestion ID {}. Reason: {}", adminId, suggestionId, request.getRejectReason());

        return SuggestionActionResponse.builder()
                .id(suggestion.getId())
                .status(suggestion.getStatus())
                .rejectReason(suggestion.getAdminNote())
                .reviewedAt(suggestion.getReviewedAt())
                .reviewedBy(suggestion.getReviewedBy())
                .build();
    }

    @Override
    @Transactional
    public SuggestionActionResponse cancelSuggestion(Long suggestionId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        TemplateSuggestion suggestion = templateSuggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_SUGGESTION_NOT_FOUND));

        if (!suggestion.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        if (suggestion.getStatus() != SuggestionStatus.PENDING && suggestion.getStatus() != SuggestionStatus.REVIEWING) {
            throw new AppException(ErrorCode.SUGGESTION_CANNOT_CANCEL);
        }

        UserTemplateFork fork = userTemplateForkRepository
                .findForkStatusByUserIdAndTemplateId(suggestion.getUserId(), suggestion.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_FORK_NOT_FOUND));

        fork.setIsProposed(false);
        fork.setProposedAt(null);

        templateSuggestionRepository.delete(suggestion);

        log.info("User {} cancelled and hard deleted Suggestion ID {}", currentUserId, suggestionId);

        return SuggestionActionResponse.builder()
                .id(suggestionId)
                .status(null)
                .build();
    }
}
