package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.BadgeConfigResponse;
import com.devlink.user_service.dto.reponse.BadgeGrantResponse;
import com.devlink.user_service.dto.reponse.BadgeVideoLimitResponse;
import com.devlink.user_service.dto.request.CreateBadgeConfigRequest;
import com.devlink.user_service.dto.request.UpdateBadgeVideoLimitRequest;

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
     * @param userId        the user ID to grant
     * @param reason        the reason for granting
     * @param adminUsername the administrator username performing the grant
     * @return the badge grant response details
     */
    BadgeGrantResponse grantRedTick(Long userId, String reason, String adminUsername);

    /**
     * Manually grant a RED_TICK badge to multiple users in batch.
     *
     * @param userIds       the list of user IDs to grant
     * @param reason        the reason for granting
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
}
