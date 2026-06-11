package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.event.ReportCreatedEvent;
import com.devlink.post_service.dto.event.ReportReviewedEvent;
import com.devlink.post_service.dto.request.CreateReportRequest;
import com.devlink.post_service.dto.request.ReportReviewRequest;
import com.devlink.post_service.dto.response.ReportResponse;
import com.devlink.post_service.entity.AccountRestriction;
import com.devlink.post_service.entity.Report;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.*;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private static final String REPORT_TOPIC = "report.created";

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final CommentReplyRepository commentReplyRepository;
    private final LearningTemplateRepository templateRepository;
    private final PostFileRepository postFileRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String REPORT_REVIEWED_TOPIC = "report.reviewed";
    private static final String REPORT_REVIEW_REDIS_KEY = "report:review:%d";
    private static final long REVIEW_TTL_SECONDS = 86400L;

    private final RedisTemplate<String, Object> redisTemplate;
    private final AccountRestrictionRepository restrictionRepository;

    @Override
    @Transactional
    public ReportResponse createOrUpdateReport(CreateReportRequest req) {
        Long reporterId = SecurityUtils.getCurrentUserId();
        validateTargetExists(req.getTargetId(), req.getTargetType());

        return reportRepository
                .findExisting(reporterId,req.getTargetId(), req.getTargetType())
                .map(existing -> handleDuplicate(existing, req))
                .orElseGet(() -> handleNew(reporterId, req));
    }

    private ReportResponse handleNew(Long reporterId, CreateReportRequest req) {
        Report report = Report.builder()
                .reporterId(reporterId)
                .targetId(req.getTargetId())
                .targetType(req.getTargetType())
                .reason(req.getReason())
                .description(req.getDescription())
                .status(ReportStatus.PENDING)
                .build();

        Report saved = reportRepository.save(report);
        publishEvent(saved, false);
        return toResponse(saved);
    }

    private ReportResponse handleDuplicate(Report existing, CreateReportRequest req) {
        boolean sameContent = existing.getReason() == req.getReason()
                && Objects.equals(existing.getDescription(), req.getDescription());

        if (sameContent) {
            throw new AppException(ErrorCode.REPORT_ALREADY_SUBMITTED);
        }

        reportRepository.updateReport(
                existing.getId(),
                req.getReason(),
                req.getDescription(),
                ReportStatus.PENDING
        );

        existing.setReason(req.getReason());
        existing.setDescription(req.getDescription());
        existing.setStatus(ReportStatus.PENDING);
        existing.setAiReviewResult(null);
        existing.setAiReviewedAt(null);

        publishEvent(existing, true);
        return toResponse(existing);
    }

    private void publishEvent(Report report, boolean isUpdate) {
        ReportCreatedEvent event = new ReportCreatedEvent(
                report.getId(),
                report.getReporterId(),
                report.getTargetId(),
                report.getTargetType().name(),
                report.getReason().name(),
                isUpdate
        );
        kafkaTemplate.send(REPORT_TOPIC, String.valueOf(report.getTargetId()), event);
    }

    private void validateTargetExists(Long targetId, TargetType targetType) {
        boolean exists = switch (targetType) {
            case POST -> postRepository.existsById(targetId);
            case COMMENT -> commentRepository.existsById(targetId);
            case COMMENT_REPLY -> commentReplyRepository.existsById(targetId);
            case TEMPLATE -> templateRepository.existsById(targetId);
            case POST_FILE -> postFileRepository.existsById(targetId);

        };

        if (!exists) throw new AppException(ErrorCode.TARGET_NOT_FOUND);
    }

    private ReportResponse toResponse(Report r) {
        return ReportResponse.builder()
                .id(r.getId())
                .reporterId(r.getReporterId())
                .targetId(r.getTargetId())
                .targetType(r.getTargetType())
                .reason(r.getReason())
                .description(r.getDescription())
                .status(r.getStatus())
                .reviewNote(r.getReviewNote())           // thêm
                .reviewedBy(r.getReviewedBy())           // thêm
                .reviewedAt(r.getReviewedAt())           // thêm
                .restrictionId(r.getRestrictionId())     // thêm
                .expiresAt(r.getExpiresAt())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public ReportResponse reviewReport(Long reportId, ReportReviewRequest req) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));

        if (report.getStatus() != ReportStatus.PENDING) {
            throw new AppException(ErrorCode.REPORT_ALREADY_REVIEWED);
        }

        Instant restrictedUntil = null;
        Long restrictionId = null;

        if (req.isApproved()) {
            restrictedUntil = req.getRestrictionDays() != null
                    ? Instant.now().plus(req.getRestrictionDays(), ChronoUnit.DAYS)
                    : null;

            AccountRestriction restriction = AccountRestriction.builder()
                    .userId(report.getTargetId())
                    .restrictionType(req.getRestrictionType())
                    .restrictedBy(String.valueOf(SecurityUtils.getCurrentUserId()))
                    .reason(report.getReason().name())
                    .restrictedUntil(restrictedUntil != null
                            ? LocalDateTime.ofInstant(restrictedUntil, ZoneOffset.UTC)
                            : null)
                    .createdAt(LocalDateTime.now())
                    .build();

            restrictionId = restrictionRepository.save(restriction).getId();
            report.setStatus(ReportStatus.RESOLVED);
        } else {
            report.setStatus(ReportStatus.REJECTED);
        }

        report.setReviewedBy(SecurityUtils.getCurrentUserId());
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewNote(req.getReviewNote());
        report.setRestrictionId(restrictionId);
        report.setExpiresAt(restrictedUntil != null
                ? LocalDateTime.ofInstant(restrictedUntil, ZoneOffset.UTC)
                : null);

        Report saved = reportRepository.save(report);

        // build event
        ReportReviewedEvent event = ReportReviewedEvent.builder()
                .reportId(saved.getId())
                .targetUserId(saved.getTargetId())
                .reporterId(saved.getReporterId())
                .approved(req.isApproved())
                .restrictionType(req.getRestrictionType())
                .reviewNote(req.getReviewNote())
                .reviewedBy(String.valueOf(SecurityUtils.getCurrentUserId()))
                .reviewedAt(Instant.now())
                .restrictedUntil(restrictedUntil)
                .build();

        // Redis trước
        String redisKey = String.format(REPORT_REVIEW_REDIS_KEY, saved.getId());
        redisTemplate.opsForValue().set(redisKey, event, REVIEW_TTL_SECONDS, TimeUnit.SECONDS);

        // Kafka sau
        kafkaTemplate.send(REPORT_REVIEWED_TOPIC, String.valueOf(saved.getId()), event);

        return toResponse(saved);
    }
}