package com.devlink.post_service.service.impl;

import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.dto.client.UserInfoForCommentClient;
import com.devlink.post_service.dto.request.CreatePenaltyConfigRequest;
import com.devlink.post_service.dto.request.UpdatePenaltyConfigRequest;
import com.devlink.post_service.dto.response.PenaltyConfigResponse;
import com.devlink.post_service.dto.response.PenalizedUserResponse;
import com.devlink.post_service.dto.response.ViolationHistoryResponse;
import com.devlink.post_service.dto.response.ViolationOverviewResponse;
import com.devlink.post_service.dto.response.ViolationTypeStatsResponse;
import com.devlink.post_service.dto.response.TopViolatorResponse;
import com.devlink.post_service.entity.ViolationHistory;
import com.devlink.post_service.entity.ViolationPenaltyConfig;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.ReportRepository;
import com.devlink.post_service.repository.ReportReporterDetailRepository;
import com.devlink.post_service.repository.ViolationHistoryRepository;
import com.devlink.post_service.repository.ViolationPenaltyConfigRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.ViolationService;
import com.devlink.post_service.service.WebSocketEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.devlink.post_service.config.Constants;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util .Map;

@Service
@RequiredArgsConstructor
public class ViolationServiceImpl implements ViolationService {

    private final ViolationHistoryRepository violationHistoryRepository;
    private final ViolationPenaltyConfigRepository penaltyConfigRepository;
    private final ReportReporterDetailRepository reporterDetailRepository;
    private final ReportRepository reportRepository;
    private final UserServiceClient userServiceClient;
    private final WebSocketEventPublisher webSocketEventPublisher;

    @Override
    public ViolationOverviewResponse getOverview() {
        long totalViolations = violationHistoryRepository.countTotal();
        long activeViolations = violationHistoryRepository.countActive();
        long totalReports = reportRepository.count();
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        long resolvedReports = reportRepository.countByStatus(ReportStatus.RESOLVED);
        long rejectedReports = reportRepository.countByStatus(ReportStatus.REJECTED);

        return ViolationOverviewResponse.builder()
                .totalViolations(totalViolations)
                .activeViolations(activeViolations)
                .totalReports(totalReports)
                .pendingReports(pendingReports)
                .resolvedReports(resolvedReports)
                .rejectedReports(rejectedReports)
                .build();
    }

    @Override
    public List<ViolationTypeStatsResponse> getDetailedOverview() {
        return Arrays.stream(TargetType.values())
                .filter(type -> type == TargetType.POST || type == TargetType.COMMENT
                        || type == TargetType.COMMENT_REPLY)
                .map(type -> {
                    long totalViolations = violationHistoryRepository.countByTargetType(type);
                    long uniqueViolators = violationHistoryRepository.countDistinctViolatorByTargetType(type);
                    List<TopViolatorResponse> topViolators = violationHistoryRepository
                            .findTopViolatorsByTargetType(type, PageRequest.of(0, 100)).getContent();
                    return ViolationTypeStatsResponse.builder()
                            .targetType(type)
                            .totalViolations(totalViolations)
                            .uniqueViolators(uniqueViolators)
                            .topViolators(topViolators)
                            .build();
                })
                .toList();
    }

    @Override
    public Page<ViolationHistoryResponse> getViolationHistories(Long violatorId, int page, int size) {
        int safeSize = Math.min(size, 20);
        return violationHistoryRepository
                .findAllFiltered(violatorId, PageRequest.of(page, safeSize))
                .map(this::toResponse);
    }

    @Override
    public List<ViolationHistoryResponse> getViolationsByUser(Long userId) {
        return violationHistoryRepository
                .findAllFiltered(userId, PageRequest.of(0, 200))
                .getContent()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ViolationHistoryResponse getViolationById(Long id) {
        return violationHistoryRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new AppException(ErrorCode.VIOLATION_NOT_FOUND));
    }

    @Override
    public List<PenaltyConfigResponse> getAllPenaltyConfigs() {
        List<ViolationPenaltyConfig> configs = penaltyConfigRepository.findAllByOrderByTargetTypeAscOffenseNumberAsc();

        List<Long> userIds = configs.stream()
                .map(c -> c.getUpdatedBy() != null ? c.getUpdatedBy() : c.getCreatedBy())
                .filter(id -> id != null)
                .distinct()
                .toList();

        Map<Long, UserInfoForCommentClient> userMap = Collections.emptyMap();
        if (!userIds.isEmpty()) {
            try {
                var response = userServiceClient.getUserBasicInfo(userIds);
                if (response != null && response.getData() != null) {
                    userMap = response.getData();
                }
            } catch (Exception e) {
                throw new AppException(ErrorCode.USER_SERVICE_UNAVAILABLE);
            }
        }

        final Map<Long, UserInfoForCommentClient> finalUserMap = userMap;
        return configs.stream()
                .map(c -> {
                    PenaltyConfigResponse dto = toConfigResponse(c);
                    Long adminId = c.getUpdatedBy() != null ? c.getUpdatedBy() : c.getCreatedBy();
                    if (adminId != null && finalUserMap.containsKey(adminId)) {
                        UserInfoForCommentClient ui = finalUserMap.get(adminId);
                        dto.setAdminName(ui.getFullName());
                        dto.setAdminAvatarUrl(ui.getAvatarUrl());
                    }
                    return dto;
                })
                .toList();
    }

    @Override
    @Transactional
    public PenaltyConfigResponse updatePenaltyConfig(Long configId, UpdatePenaltyConfigRequest request) {
        var config = penaltyConfigRepository.findById(configId)
                .orElseThrow(() -> new AppException(ErrorCode.PENALTY_CONFIG_NOT_FOUND));

        config.setPenaltyDays(request.getPenaltyDays());
        config.setPermanent(request.getPermanent());
        if (request.getActive() != null) {
            if (!request.getActive() && config.getOffenseNumber() == 1) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }
            config.setActive(request.getActive());
        }
        config.setUpdatedBy(SecurityUtils.getCurrentUserId());

        ViolationPenaltyConfig updated = penaltyConfigRepository.save(config);
        webSocketEventPublisher.publishAdminEvent(Constants.PENALTY_CONFIG_UPDATED_EVENT, null);
        return toConfigResponse(updated);
    }

    @Override
    @Transactional
    public void updateAdminNote(Long reportId, String adminNote) {
        var detail = reporterDetailRepository.findByReportId(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));
        detail.setAdminNote(adminNote);
        reporterDetailRepository.save(detail);
    }

    @Override
    @Transactional
    public PenaltyConfigResponse createPenaltyConfig(CreatePenaltyConfigRequest request) {
        // Find current max offense number for the target type
        int maxOffense = penaltyConfigRepository.findAllByOrderByTargetTypeAscOffenseNumberAsc().stream()
                .filter(c -> c.getTargetType().equals(request.getTargetType()))
                .mapToInt(ViolationPenaltyConfig::getOffenseNumber)
                .max()
                .orElse(0);

        ViolationPenaltyConfig config = ViolationPenaltyConfig.builder()
                .targetType(request.getTargetType())
                .reason("ALL")
                .offenseNumber(maxOffense + 1)
                .penaltyDays(request.getPenaltyDays())
                .permanent(request.getPermanent())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        ViolationPenaltyConfig updated = penaltyConfigRepository.save(config);
        webSocketEventPublisher.publishAdminEvent(Constants.PENALTY_CONFIG_UPDATED_EVENT, null);
        return toConfigResponse(updated);
    }

    @Override
    @Transactional
    public void deletePenaltyConfig(Long configId) {
        var config = penaltyConfigRepository.findById(configId)
                .orElseThrow(() -> new AppException(ErrorCode.PENALTY_CONFIG_NOT_FOUND));

        if (config.getOffenseNumber() == 1) {
            throw new AppException(ErrorCode.PENALTY_CONFIG_CANNOT_DELETE_FIRST_LEVEL);
        }

        String targetType = config.getTargetType();
        int deletedOffenseNumber = config.getOffenseNumber();

        penaltyConfigRepository.delete(config);

        // Re-index remaining configs
        List<ViolationPenaltyConfig> configs = penaltyConfigRepository.findAllByOrderByTargetTypeAscOffenseNumberAsc()
                .stream()
                .filter(c -> c.getTargetType().equals(targetType) && c.getOffenseNumber() > deletedOffenseNumber)
                .toList();

        for (ViolationPenaltyConfig c : configs) {
            c.setOffenseNumber(c.getOffenseNumber() - 1);
        }
        penaltyConfigRepository.saveAll(configs);

        webSocketEventPublisher.publishAdminEvent(Constants.PENALTY_CONFIG_UPDATED_EVENT, null);
    }

    @Override
    public Page<PenalizedUserResponse> getUsersByViolationCount(TargetType targetType, Integer violationCount, int page,
            int size) {
        int safeSize = Math.min(size, 50);
        return violationHistoryRepository.findUsersByCurrentViolationCount(targetType, violationCount,
                PageRequest.of(page, safeSize));
    }

    private ViolationHistoryResponse toResponse(ViolationHistory v) {
        return ViolationHistoryResponse.builder()
                .id(v.getId())
                .reportId(v.getReportId())
                .violatorId(v.getViolatorId())
                .targetType(v.getTargetType())
                .targetId(v.getTargetId())
                .reason(v.getReason())
                .violationAt(v.getViolationAt())
                .penaltyStartAt(v.getPenaltyStartAt())
                .penaltyEndAt(v.getPenaltyEndAt())
                .violationCount(v.getViolationCount())
                .restrictionId(v.getRestrictionId())
                .createdAt(v.getCreatedAt())
                .build();
    }

    private PenaltyConfigResponse toConfigResponse(ViolationPenaltyConfig c) {
        return PenaltyConfigResponse.builder()
                .id(c.getId())
                .targetType(c.getTargetType())
                .reason(c.getReason())
                .offenseNumber(c.getOffenseNumber())
                .penaltyDays(c.getPenaltyDays())
                .permanent(c.getPermanent())
                .createdBy(c.getCreatedBy())
                .createdAt(c.getCreatedAt())
                .active(c.getActive())
                .updatedBy(c.getUpdatedBy())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
