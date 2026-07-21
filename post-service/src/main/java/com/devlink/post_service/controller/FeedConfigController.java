package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.FeedScoringConfigRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.FeedScoringConfigResponse;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.FeedConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.devlink.post_service.config.Constants.SUCCESS;

/**
 * Admin-only endpoints for managing feed scoring configuration.
 *
 * All values are stored in feed_scoring_config table and cached in Redis.
 * Changes take effect within 10 minutes (Redis TTL) without any server restart.
 *
 * Configurable keys:
 *   score.view               - points per VIEW
 *   score.like               - points per LIKE
 *   score.bookmark           - points per BOOKMARK
 *   score.share              - points per SHARE
 *   feed.top_tags_limit      - how many top tags to fetch for feed generation
 *   feed.min_like_threshold  - minimum likes for a post to appear
 *   feed.fallback_threshold  - result count below which trending feed is used instead
 *   interest.decay_rate      - daily score decay multiplier (e.g. 0.95 = 5%/day)
 */
@RestController
@RequestMapping("/api/admin/feed-config")
@RequiredArgsConstructor
public class FeedConfigController {

    private final FeedConfigService feedConfigService;

    /**
     * Returns all configurable scoring parameters.
     * Used to populate the admin config panel.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FeedScoringConfigResponse>>> getAllConfigs() {
        return ResponseEntity.ok(ApiResponse.ok(feedConfigService.getAllConfigs(), SUCCESS));
    }

    /**
     * Updates a single config parameter.
     * Redis cache is invalidated immediately after the update.
     *
     * @param request body containing configKey and new configValue
     */
    @PutMapping
    public ResponseEntity<ApiResponse<FeedScoringConfigResponse>> updateConfig(
            @Valid @RequestBody FeedScoringConfigRequest request) {
        Long adminId = SecurityUtils.getCurrentUserId();
        FeedScoringConfigResponse updated = feedConfigService.updateConfig(request, adminId);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Config updated successfully"));
    }
}
