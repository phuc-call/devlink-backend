package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.UpdatePenaltyConfigRequest;
import com.devlink.post_service.dto.request.CreatePenaltyConfigRequest;
import com.devlink.post_service.dto.response.PenaltyConfigResponse;
import com.devlink.post_service.dto.response.PenalizedUserResponse;
import com.devlink.post_service.dto.response.ViolationHistoryResponse;
import com.devlink.post_service.dto.response.ViolationOverviewResponse;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.dto.response.ViolationTypeStatsResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ViolationService {

    /**
     * Returns aggregated overview stats: total violations, active violations,
     * total reports breakdown by status.
     */
    ViolationOverviewResponse getOverview();

    /**
     * Returns detailed stats by target type (violations, unique users, top violators)
     */
    List<ViolationTypeStatsResponse> getDetailedOverview();

    /**
     * Returns a paginated list of all violation histories.
     * Optionally filtered by violatorId.
     *
     * @param violatorId optional filter by the violating user
     * @param page       zero-based page index
     * @param size       page size (max 20)
     */
    Page<ViolationHistoryResponse> getViolationHistories(Long violatorId, int page, int size);

    /**
     * Returns the complete violation history for a specific user.
     *
     * @param userId the user whose violation history is being queried
     */
    List<ViolationHistoryResponse> getViolationsByUser(Long userId);

    /**
     * Returns a single violation history record by its ID.
     *
     * @param id the violation history record ID
     */
    ViolationHistoryResponse getViolationById(Long id);

    /**
     * Returns all penalty config entries, ordered by targetType and offenseNumber.
     */
    List<PenaltyConfigResponse> getAllPenaltyConfigs();

    /**
     * Updates the penalty days and permanent flag for a specific config entry.
     * Only accessible by admin.
     *
     * @param configId the penalty config ID to update
     * @param request  new penalty values
     */
    PenaltyConfigResponse updatePenaltyConfig(Long configId, UpdatePenaltyConfigRequest request);

    /**
     * Updates the admin note on a reporter detail record for a given report.
     *
     * @param reportId  the report whose admin note should be updated
     * @param adminNote the new admin note text
     */
    void updateAdminNote(Long reportId, String adminNote);

    /**
     * Creates a new penalty config.
     */
    PenaltyConfigResponse createPenaltyConfig(CreatePenaltyConfigRequest request);

    /**
     * Deletes a penalty config (except offenseNumber 1).
     */
    void deletePenaltyConfig(Long configId);

    /**
     * Returns a paginated list of users whose max violation count for the target type equals the given count.
     */
    Page<PenalizedUserResponse> getUsersByViolationCount(
            TargetType targetType, 
            Integer violationCount, 
            int page, 
            int size
    );
}
