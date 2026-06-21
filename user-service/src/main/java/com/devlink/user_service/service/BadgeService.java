package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.*;
import com.devlink.user_service.dto.request.CreateBadgeConfigRequest;
import com.devlink.user_service.dto.request.UpdateBadgeVideoLimitRequest;
import com.devlink.user_service.entity.enums.BadgeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BadgeService {
    /**
     * Evaluate the user's statistics against the active badge configuration
     * to automatically assign or downgrade POPULAR or BLUE_TICK badges.
     *
     * @param userId the user ID to evaluate
     */
    void evaluateUser(Long userId);

    /**
     * Manually grant a RED_TICK badge to a single user.
     *
     * @param userId the user ID to grant
     * @param reason the reason for granting
     * @param adminUsername the administrator username performing the grant
     * @return the badge grant response details
     */
    BadgeGrantResponse grantRedTick(Long userId, String reason, String adminUsername);

    /**
     * Manually grant a RED_TICK badge to multiple users in batch.
     *
     * @param userIds the list of user IDs to grant
     * @param reason the reason for granting
     * @param adminUsername the administrator username performing the grant
     * @return the list of badge grant response details
     */
    List<BadgeGrantResponse> grantRedTickBatch(List<Long> userIds, String reason, String adminUsername);

    /**
     * Retrieve all available badge configurations.
     *
     * @return list of badge configuration responses
     */
    List<BadgeConfigResponse> getAllBadgeConfigs();

    /**
     * Retrieve the currently active badge configuration.
     *
     * @return the active badge configuration details
     */
    BadgeConfigResponse getActiveBadgeConfig();

    /**
     * Create a new badge configuration (default inactive).
     *
     * @param request the configuration parameters
     * @param adminId the administrator ID who creates the configuration
     * @return the created badge configuration details
     */
    BadgeConfigResponse createBadgeConfig(CreateBadgeConfigRequest request, Long adminId);

    /**
     * Update an existing badge configuration.
     *
     * @param id      the configuration ID to update
     * @param request the updated configuration parameters
     * @param adminId the administrator ID who updates the configuration
     * @return the updated badge configuration details
     */
    BadgeConfigResponse updateBadgeConfig(Long id, CreateBadgeConfigRequest request, Long adminId);

    /**
     * Retrieve all badge video limits configuration.
     *
     * @return list of badge video limit responses
     */
    List<BadgeVideoLimitResponse> getAllBadgeVideoLimits();

    /**
     * Update the video limits for a specific badge type.
     *
     * @param badgeType the badge type string (e.g. "NONE", "POPULAR")
     * @param request   the new limit parameters
     * @param adminId   the administrator ID who updates the limit
     * @return the updated badge video limit details
     */
    BadgeVideoLimitResponse updateBadgeVideoLimit(String badgeType, UpdateBadgeVideoLimitRequest request, Long adminId);

    /**
     * Search users by username or email, with pagination support.
     *
     * @param keyword search keyword (username or email), can be null/empty to retrieve all users
     * @param pageable pagination information
     * @return paginated UserSummaryResponse results
     */
    Page<UserSummaryResponse> searchUsers(String keyword, Pageable pageable);

    /**
     * View the current badge and complete badge history of a user.
     *
     * @param userId ID of the user to view
     * @return badge details and history
     */
    UserBadgeDetailResponse getUserBadgeDetail(Long userId);

    /**
     * Get statistics of users grouped by badge type.
     *
     * @return the number of users for each badge type and the total count
     */
    BadgeStatsResponse getBadgeStats();

    /**
     * Retrieve users by badge type, with pagination support.
     *
     * @param badgeType badge type to filter by
     * @param pageable pagination information
     * @return paginated UserSummaryResponse results
     */
    Page<UserSummaryResponse> getUsersByBadgeType(BadgeType badgeType, Pageable pageable);
}
