package com.devlink.user_service.controller;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.dto.reponse.BadgeConfigResponse;
import com.devlink.user_service.dto.reponse.BadgeGrantResponse;
import com.devlink.user_service.dto.reponse.BadgeVideoLimitResponse;
import com.devlink.user_service.dto.request.CreateBadgeConfigRequest;
import com.devlink.user_service.dto.request.GrantRedTickRequest;
import com.devlink.user_service.dto.request.UpdateBadgeVideoLimitRequest;
import com.devlink.user_service.service.BadgeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        return ResponseEntity.ok(ApiResponse.ok(created, "Badge config created successfully"));
    }

    @PutMapping("/admin/badges/configs/{id}")
    public ResponseEntity<ApiResponse<BadgeConfigResponse>> updateBadgeConfig(
            @PathVariable Long id,
            @RequestBody @Valid CreateBadgeConfigRequest request) {
        Long adminId = userHelper.getCurrentUser().getId();
        BadgeConfigResponse updated = badgeService.updateBadgeConfig(id, request, adminId);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Badge config updated successfully"));
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
        return ResponseEntity.ok(ApiResponse.ok(updated, "Badge video limit updated successfully"));
    }

    @PostMapping("/admin/badges/red-tick/{userId}")
    public ResponseEntity<ApiResponse<BadgeGrantResponse>> grantRedTick(
            @PathVariable Long userId,
            @RequestParam(required = false) String reason) {
        String adminUsername = userHelper.getCurrentUser().getUsername();
        BadgeGrantResponse response = badgeService.grantRedTick(userId, reason, adminUsername);
        return ResponseEntity.ok(ApiResponse.ok(response, "Red tick granted successfully"));
    }

    @PostMapping("/admin/badges/red-tick/batch")
    public ResponseEntity<ApiResponse<List<BadgeGrantResponse>>> grantRedTickBatch(
            @RequestBody @Valid GrantRedTickRequest request) {
        String adminUsername = userHelper.getCurrentUser().getUsername();
        List<BadgeGrantResponse> responses = badgeService.grantRedTickBatch(request.getUserIds(), request.getReason(), adminUsername);
        return ResponseEntity.ok(ApiResponse.ok(responses, "Red tick batch granted successfully"));
    }

    @PostMapping("/badges/{userId}/evaluate")
    public ResponseEntity<ApiResponse<Void>> evaluateUser(@PathVariable Long userId) {
        badgeService.evaluateUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Badge evaluation triggered"));
    }
}
