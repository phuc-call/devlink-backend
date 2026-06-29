package com.devlink.user_service.controller;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.config.Constants;
import com.devlink.user_service.dto.response.*;
import com.devlink.user_service.dto.request.CreateBadgeConfigRequest;
import com.devlink.user_service.dto.request.GrantRedTickRequest;
import com.devlink.user_service.dto.request.UpdateBadgeVideoLimitRequest;
import com.devlink.user_service.entity.enums.BadgeType;
import com.devlink.user_service.service.BadgeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.devlink.user_service.config.Constants.*;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class BadgeController {
    private final BadgeService badgeService;
    private final UserHelper userHelper;

    @GetMapping("/badges/configs")
    public ResponseEntity<ApiResponse<List<BadgeConfigResponse>>> getAllBadgeConfigs() {
        return ResponseEntity.ok(ApiResponse.ok(badgeService.getAllBadgeConfigs()));
    }

    @GetMapping("/badges/configs/active")
    public ResponseEntity<ApiResponse<BadgeConfigResponse>> getActiveBadgeConfig() {
        return ResponseEntity.ok(ApiResponse.ok(badgeService.getActiveBadgeConfig()));
    }

    @PostMapping("/admin/badges/configs")
    public ResponseEntity<ApiResponse<BadgeConfigResponse>> createBadgeConfig(
            @RequestBody @Valid CreateBadgeConfigRequest request) {
        Long adminId = userHelper.getCurrentUser().getId();
        BadgeConfigResponse created = badgeService.createBadgeConfig(request, adminId);
        return ResponseEntity.ok(ApiResponse.ok(created, Constants.INFOMATION_CREATE_BADGE_CONFIG));
    }

    @PutMapping("/admin/badges/configs/{id}")
    public ResponseEntity<ApiResponse<BadgeConfigResponse>> updateBadgeConfig(
            @PathVariable Long id,
            @RequestBody @Valid CreateBadgeConfigRequest request) {
        Long adminId = userHelper.getCurrentUser().getId();
        BadgeConfigResponse updated = badgeService.updateBadgeConfig(id, request, adminId);
        return ResponseEntity.ok(ApiResponse.ok(updated, Constants.INFOMATION_UPDATE_BADGE_CONFIG));
    }

    @GetMapping("/badges/video-limits")
    public ResponseEntity<ApiResponse<List<BadgeVideoLimitResponse>>> getAllBadgeVideoLimits() {
        return ResponseEntity.ok(ApiResponse.ok(badgeService.getAllBadgeVideoLimits()));
    }

    @PutMapping("/admin/badges/video-limits/{badgeType}")
    public ResponseEntity<ApiResponse<BadgeVideoLimitResponse>> updateBadgeVideoLimit(
            @PathVariable String badgeType,
            @RequestBody @Valid UpdateBadgeVideoLimitRequest request) {
        Long adminId = userHelper.getCurrentUser().getId();
        BadgeVideoLimitResponse updated = badgeService.updateBadgeVideoLimit(badgeType, request, adminId);
        return ResponseEntity.ok(ApiResponse.ok(updated, Constants.INFOMATION_UPDATE_BADGE_VIDEO_LIMIT));
    }

    @PostMapping("/admin/badges/red-tick/{userId}")
    public ResponseEntity<ApiResponse<BadgeGrantResponse>> grantRedTick(
            @PathVariable Long userId,
            @RequestParam(required = false) String reason) {
        String adminUsername = userHelper.getCurrentUser().getUsername();
        BadgeGrantResponse response = badgeService.grantRedTick(userId, reason, adminUsername);
        return ResponseEntity.ok(ApiResponse.ok(response, Constants.INFOMATION_GRANT_RED_TICK));
    }

    @PostMapping("/admin/badges/red-tick/batch")
    public ResponseEntity<ApiResponse<List<BadgeGrantResponse>>> grantRedTickBatch(
            @RequestBody @Valid GrantRedTickRequest request) {
        String adminUsername = userHelper.getCurrentUser().getUsername();
        List<BadgeGrantResponse> responses = badgeService.grantRedTickBatch(request.getUserIds(), request.getReason(),
                adminUsername);
        return ResponseEntity.ok(ApiResponse.ok(responses, Constants.INFOMATION_GRANT_RED_TICK_BATCH));
    }

    @PostMapping("/badges/{userId}/evaluate")
    public ResponseEntity<ApiResponse<Void>> evaluateUser(@PathVariable Long userId) {
        badgeService.evaluateUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, Constants.INFOMATION_EVALUATE_USER));
    }

    @GetMapping("/admin/users/search")
    public ResponseEntity<ApiResponse<Page<UserSummaryResponse>>> searchUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = DEFAULT_PAGE_SIZE_SMALL) @Max(10) @Min(0) int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(badgeService.searchUsers(keyword, pageable)));
    }

    @GetMapping("/admin/{userId}/badge")
    public ResponseEntity<ApiResponse<UserBadgeDetailResponse>> getUserBadgeDetail(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(badgeService.getUserBadgeDetail(userId)));
    }

    @GetMapping("/admin/badges/stats")
    public ResponseEntity<ApiResponse<BadgeStatsResponse>> getBadgeStats() {
        return ResponseEntity.ok(ApiResponse.ok(badgeService.getBadgeStats()));
    }

    @GetMapping("/admin/badges/users")
    public ResponseEntity<ApiResponse<Page<UserSummaryResponse>>> getUsersByBadgeType(
            @RequestParam BadgeType badgeType,
            @RequestParam(defaultValue = DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = DEFAULT_PAGE_SIZE) @Max(20) @Min(0) int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(badgeService.getUsersByBadgeType(badgeType, pageable)));
    }
}
