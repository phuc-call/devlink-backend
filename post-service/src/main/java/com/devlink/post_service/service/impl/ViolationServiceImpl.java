package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.request.UpdatePenaltyConfigRequest;
import com.devlink.post_service.dto.response.PenaltyConfigResponse;
import com.devlink.post_service.dto.response.ViolationHistoryResponse;
import com.devlink.post_service.dto.response.ViolationOverviewResponse;
import com.devlink.post_service.entity.ViolationHistory;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.ReportRepository;
import com.devlink.post_service.repository.ReportReporterDetailRepository;
import com.devlink.post_service.repository.ViolationHistoryRepository;
import com.devlink.post_service.repository.ViolationPenaltyConfigRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.ViolationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ViolationServiceImpl implements ViolationService {

    private final ViolationHistoryRepository violationHistoryRepository;
    private final ViolationPenaltyConfigRepository penaltyConfigRepository;
    private final ReportReporterDetailRepository reporterDetailRepository;
    private final ReportRepository reportRepository;

    @Override
    public ViolationOverviewResponse getOverview() {
        long totalViolations  = violationHistoryRepository.countTotal();
        long activeViolations = violationHistoryRepository.countActive();
        long totalReports     = reportRepository.count();
        long pendingReports   = reportRepository.countByStatus(ReportStatus.PENDING);
        long resolvedReports  = reportRepository.countByStatus(ReportStatus.RESOLVED);
        long rejectedReports  = reportRepository.countByStatus(ReportStatus.REJECTED);

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
        return penaltyConfigRepository.findAllByOrderByTargetTypeAscOffenseNumberAsc()
                .stream()
                .map(this::toConfigResponse)
                .toList();
    }

    @Override
    @Transactional
    public PenaltyConfigResponse updatePenaltyConfig(Long configId, UpdatePenaltyConfigRequest request) {
        var config = penaltyConfigRepository.findById(configId)
                .orElseThrow(() -> new AppException(ErrorCode.PENALTY_CONFIG_NOT_FOUND));

        config.setPenaltyDays(request.getPenaltyDays());
        config.setPermanent(request.getPermanent());
        config.setUpdatedBy(SecurityUtils.getCurrentUserId());

        return toConfigResponse(penaltyConfigRepository.save(config));
    }

    @Override
    @Transactional
    public void updateAdminNote(Long reportId, String adminNote) {
        var detail = reporterDetailRepository.findByReportId(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));
        detail.setAdminNote(adminNote);
        reporterDetailRepository.save(detail);
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

    private PenaltyConfigResponse toConfigResponse(com.devlink.post_service.entity.ViolationPenaltyConfig c) {
        return PenaltyConfigResponse.builder()
                .id(c.getId())
                .targetType(c.getTargetType())
                .reason(c.getReason())
                .offenseNumber(c.getOffenseNumber())
                .penaltyDays(c.getPenaltyDays())
                .permanent(c.getPermanent())
                .updatedBy(c.getUpdatedBy())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
