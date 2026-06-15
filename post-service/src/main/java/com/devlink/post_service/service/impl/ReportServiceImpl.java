package com.devlink.post_service.service.impl;

import com.devlink.post_service.client.cache.UserInfoCacheClient;
import com.devlink.post_service.dto.client.UserInfoForCommentClient;
import com.devlink.post_service.dto.event.ReportCreatedEvent;
import com.devlink.post_service.dto.event.ReportReviewedEvent;
import com.devlink.post_service.dto.procedure.ReportItemProjection;
import com.devlink.post_service.dto.redis.ReportNotificationRedis;
import com.devlink.post_service.dto.request.CreateReportRequest;
import com.devlink.post_service.dto.request.ReportReviewRequest;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.AccountRestriction;
import com.devlink.post_service.entity.Report;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.RestrictionType;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.AccountRestrictionRepository;
import com.devlink.post_service.repository.ReportRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.ReportService;
import com.devlink.post_service.service.ReportTargetHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import static com.devlink.post_service.config.Constants.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final AccountRestrictionRepository restrictionRepository;
    private final UserInfoCacheClient userInfoCacheClient;

    private final List<ReportTargetHandler> handlers;
    private final ObjectMapper objectMapper;
    private final RedisTemplate<String, Object> objectRedisTemplate;

    private ReportTargetHandler getHandler(TargetType type) {
        return handlers.stream()
                .filter(h -> h.getType() == type)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.TARGET_NOT_FOUND));
    }

    /**
     * Defends against legacy Redis snapshots that were stored as raw JPA entities
     * (before toSnapshot() was refactored to return Map<String, Object>).
     * Those entities deserialize with detached lazy collections that blow up
     * Jackson during HTTP response serialization. Anything that isn't a Map
     * is treated as stale/legacy and dropped (TTL will expire it naturally).
     */
    private Object sanitizeSnapshot(Object raw) {
        if (raw == null || raw instanceof Map) {
            return raw;
        }
        log.warn("Legacy snapshot format detected (type={}), discarding", raw.getClass().getName());
        return null;
    }

    @Override
    @Transactional
    public ReportResponse createOrUpdateReport(CreateReportRequest req) {
        Long reporterId = SecurityUtils.getCurrentUserId();


        if (!getHandler(req.getTargetType()).exists(req.getTargetId())) {
            throw new AppException(ErrorCode.TARGET_NOT_FOUND);
        }

        return reportRepository
                .findExisting(reporterId, req.getTargetId(), req.getTargetType())
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
                report.getDescription(),
                isUpdate
        );
        kafkaTemplate.send(REPORT_TOPIC, String.valueOf(report.getTargetId()), event);
    }

    @Override
    @Transactional
    public ReportResponse reviewReport(Long reportId, ReportReviewRequest req) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));

        if (report.getStatus() != ReportStatus.PENDING) {
            throw new AppException(ErrorCode.REPORT_ALREADY_REVIEWED);
        }

        Long adminId = SecurityUtils.getCurrentUserId();

        if (req.isApproved()) {
            // Get the corresponding handler via the helper function.
            ReportTargetHandler handler = getHandler(report.getTargetType());

            // Get the exact author ID of the creator's content.
            Long authorId = handler.getAuthorId(report.getTargetId());

            // Delete layered junk files + Save backup snapshot to Redis
            Object snapshot = handler.deleteAndGetSnapshot(report.getTargetId());
            String key = String.format(DELETED_CONTENT_KEY, handler.getSnapshotKey(), report.getTargetId());
            redisTemplate.opsForValue().set(key, snapshot, DELETED_SNAPSHOT_DAYS, TimeUnit.DAYS);

            Instant restrictedUntil = req.isPermanent() ? null : Instant.now().plus(7, ChronoUnit.DAYS);
            RestrictionType restrictionType = handler.getRestrictionType();

            // save history report
            AccountRestriction restriction = AccountRestriction.builder()
                    .userId(authorId) // Punish the RIGHT person.
                    .restrictionType(restrictionType)
                    .restrictedBy(String.valueOf(adminId))
                    .reason(report.getReason().name())
                    .restrictedUntil(restrictedUntil)
                    .build();

            Long restrictionId = restrictionRepository.save(restriction).getId();

            report.setStatus(ReportStatus.RESOLVED);
            report.setRestrictionId(restrictionId);
            report.setExpiresAt(restrictedUntil != null
                    ? LocalDateTime.ofInstant(restrictedUntil, ZoneOffset.UTC)
                    : null);

            publishReviewedEvent(report, authorId, adminId, req, restrictionType, true, restrictedUntil);

        } else {
            report.setStatus(ReportStatus.REJECTED);
            publishReviewedEvent(report, null, adminId, req, null, false, null);
        }

        report.setReviewedBy(adminId);
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewNote(req.getReviewNote());

        return toResponse(reportRepository.save(report));
    }

    private void publishReviewedEvent(Report report, Long targetUserId, Long adminId,
                                      ReportReviewRequest req,
                                      RestrictionType restrictionType,
                                      boolean approved,
                                      Instant restrictedUntil) {
        ReportReviewedEvent event = ReportReviewedEvent.builder()
                .reportId(report.getId())
                .targetUserId(targetUserId)
                .reporterId(report.getReporterId())
                .approved(approved)
                .restrictionType(restrictionType)
                .reviewNote(req.getReviewNote())
                .reviewedBy(String.valueOf(adminId))
                .reviewedAt(Instant.now())
                .restrictedUntil(restrictedUntil)
                .targetId(report.getTargetId())
                .targetType(report.getTargetType().name())
                .reason(report.getReason().name())
                .description(report.getDescription())
                .build();

        kafkaTemplate.send(REPORT_REVIEWED_TOPIC, String.valueOf(report.getId()), event);
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
                .reviewNote(r.getReviewNote())
                .reviewedBy(r.getReviewedBy())
                .reviewedAt(r.getReviewedAt())
                .restrictionId(r.getRestrictionId())
                .expiresAt(r.getExpiresAt())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    @Override
    public ReportPageResponse getReports(TargetType targetType, ReportStatus status, int page, int size) {
        int safeSize = Math.min(size, 20);
        Pageable pageable = PageRequest.of(page, safeSize);

        Page<ReportItemProjection> result = switch (targetType) {
            case POST -> reportRepository.findPostReports(status, pageable);
            case COMMENT -> reportRepository.findCommentReports(status, pageable);
            case COMMENT_REPLY -> reportRepository.findCommentReplyReports(status, pageable);
            default -> throw new AppException(ErrorCode.TARGET_NOT_FOUND);
        };

        List<ReportItemProjection> projections = result.getContent();

        List<Long> userIds = projections.stream()
                .flatMap(p -> Stream.of(p.getViolatorUserId(), p.getReporterId()))
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, UserInfoForCommentClient> userMap = userIds.isEmpty()
                ? Map.of()
                : userInfoCacheClient.getBasicInfo(userIds);

        List<ReportItemResponse> items = projections.stream()
                .map(p -> ReportItemResponse.builder()
                        .reportId(p.getReportId())
                        .targetId(p.getTargetId())
                        .targetType(p.getTargetType())
                        .violatorUserId(p.getViolatorUserId())
                        .violatorName(userName(userMap, p.getViolatorUserId()))
                        .reporterId(p.getReporterId())
                        .reporterName(userName(userMap, p.getReporterId()))
                        .reason(p.getReason())
                        .description(p.getDescription())
                        .status(p.getStatus())
                        .createdAt(p.getCreatedAt())
                        .build())
                .toList();

        return ReportPageResponse.builder()
                .items(items)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    private String userName(Map<Long, UserInfoForCommentClient> map, Long userId) {
        if (userId == null) return null;
        UserInfoForCommentClient info = map.get(userId);
        return info != null ? info.getFullName() : null;
    }
    @Override
    @Transactional
    public void deleteReport(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));

        if (report.getStatus() == ReportStatus.PENDING) {
            throw new AppException(ErrorCode.REPORT_CANNOT_DELETE);
        }

        reportRepository.delete(report);
    }


    @Override
    @Transactional
    public List<MyViolationResponse> getMyViolations() {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        List<AccountRestriction> restrictions = restrictionRepository.findAllByUserId(currentUserId);
        return restrictions.stream()
                .map(restriction -> {
                    TargetType targetType = null;
                    Long targetId = null;
                    Object snapshot = null;

                    Optional<Report> reportOpt = reportRepository.findByRestrictionId(restriction.getId());
                    if (reportOpt.isPresent()) {
                        Report report = reportOpt.get();
                        targetType = report.getTargetType();
                        targetId = report.getTargetId();

                        String key = String.format(DELETED_CONTENT_KEY,
                                getHandler(targetType).getSnapshotKey(), targetId);
                        snapshot = sanitizeSnapshot(redisTemplate.opsForValue().get(key));
                    }

                    return MyViolationResponse.builder()
                            .restrictionId(restriction.getId())
                            .restrictionType(restriction.getRestrictionType())
                            .reason(restriction.getReason())
                            .permanent(restriction.getRestrictedUntil() == null)
                            .restrictedUntil(restriction.getRestrictedUntil())
                            .createdAt(restriction.getCreatedAt())
                            .targetType(targetType)
                            .targetId(targetId)
                            .deletedSnapshot(snapshot)
                            .build();
                })
                .toList();
    }

    @Override
    @Transactional
    public ReportDetailResponse getReportDetail(Long notificationId){
        Long currentUserId=SecurityUtils.getCurrentUserId();
        String key=String.format(REPORT_NOTIFICATION_KEY, notificationId);
        log.info("[ReportDetail] Looking up Redis key='{}'", key);
        Object raw = objectRedisTemplate.opsForValue().get(key);
        ReportNotificationRedis payload = objectMapper.convertValue(raw, ReportNotificationRedis.class);

        if (payload == null) {
            throw new AppException(ErrorCode.REPORT_NOT_FOUND);
        }

        //Chỉ người tố cáo mới được xem
        if (!payload.getReporterId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        TargetType targetType= TargetType.valueOf(payload.getTargetType());
        ReportTargetHandler reportTargetHandler=getHandler(targetType);
        Object targetContent;
        boolean contentDeleted;

        if (reportTargetHandler.exists(payload.getTargetId())) {
            targetContent = reportTargetHandler.getSnapshot(payload.getTargetId());
            contentDeleted = false;
        } else {
            String snapshotKey = String.format(DELETED_CONTENT_KEY,
                    reportTargetHandler.getSnapshotKey(), payload.getTargetId());
            targetContent = sanitizeSnapshot(redisTemplate.opsForValue().get(snapshotKey));
            contentDeleted = true;
        }

        return ReportDetailResponse.builder()
                .reportId(payload.getReportId())
                .targetType(payload.getTargetType())
                .targetId(payload.getTargetId())
                .reason(payload.getReason())
                .description(payload.getDescription())
                .targetContent(targetContent)
                .contentDeleted(contentDeleted)
                .build();
    }


}