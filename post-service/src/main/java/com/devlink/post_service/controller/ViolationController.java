package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.CreatePenaltyConfigRequest;
import com.devlink.post_service.dto.request.UpdatePenaltyConfigRequest;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.service.ViolationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/posts/violations")
@RequiredArgsConstructor
public class ViolationController {

    private final ViolationService violationService;

    @GetMapping("/admin/overview")
    public ResponseEntity<ApiResponse<ViolationOverviewResponse>> getOverview() {
        return ResponseEntity.ok(ApiResponse.ok(violationService.getOverview(), "OK"));
    }

    @GetMapping("/admin/overview/detailed")
    public ResponseEntity<ApiResponse<List<ViolationTypeStatsResponse>>> getDetailedOverview() {
        return ResponseEntity.ok(ApiResponse.ok(violationService.getDetailedOverview(), "OK"));
    }

    @GetMapping("/admin/histories")
    public ResponseEntity<ApiResponse<Page<ViolationHistoryResponse>>> getHistories(
            @RequestParam(required = false) Long violatorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") @Max(20) int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                violationService.getViolationHistories(violatorId, page, size), "OK"));
    }

    @GetMapping("/admin/histories/{id}")
    public ResponseEntity<ApiResponse<ViolationHistoryResponse>> getHistoryById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(violationService.getViolationById(id), "OK"));
    }

    @GetMapping("/admin/user/{userId}")
    public ResponseEntity<ApiResponse<List<ViolationHistoryResponse>>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(violationService.getViolationsByUser(userId), "OK"));
    }

    @GetMapping("/admin/penalty-configs")
    public ResponseEntity<ApiResponse<List<PenaltyConfigResponse>>> getPenaltyConfigs() {
        return ResponseEntity.ok(ApiResponse.ok(violationService.getAllPenaltyConfigs(), "OK"));
    }

    @PutMapping("/admin/penalty-configs/{configId}")
    public ResponseEntity<ApiResponse<PenaltyConfigResponse>> updatePenaltyConfig(
            @PathVariable Long configId,
            @Valid @RequestBody UpdatePenaltyConfigRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                violationService.updatePenaltyConfig(configId, request),
                "Penalty config updated successfully"));
    }

    @PostMapping("/admin/penalty-configs")
    public ResponseEntity<ApiResponse<PenaltyConfigResponse>> createPenaltyConfig(
            @Valid @RequestBody CreatePenaltyConfigRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                violationService.createPenaltyConfig(request),
                "Penalty config created successfully"));
    }

    @DeleteMapping("/admin/penalty-configs/{configId}")
    public ResponseEntity<ApiResponse<Void>> deletePenaltyConfig(@PathVariable Long configId) {
        violationService.deletePenaltyConfig(configId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Penalty config deleted successfully"));
    }

    @GetMapping("/admin/users-by-count")
    public ResponseEntity<ApiResponse<Page<PenalizedUserResponse>>> getUsersByViolationCount(
            @RequestParam TargetType targetType,
            @RequestParam Integer violationCount,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") @Max(50) int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                violationService.getUsersByViolationCount(targetType, violationCount, page, size),
                "OK"));
    }

    @PatchMapping("/admin/reporter-details/{reportId}/note")
    public ResponseEntity<ApiResponse<Void>> updateAdminNote(
            @PathVariable Long reportId,
            @RequestBody Map<String, String> body
    ) {
        violationService.updateAdminNote(reportId, body.get("adminNote"));
        return ResponseEntity.ok(ApiResponse.ok(null, "Admin note updated successfully"));
    }
}
