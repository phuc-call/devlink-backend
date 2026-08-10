package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.ReportReviewRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.ReportAdminDetailResponse;
import com.devlink.post_service.dto.response.ReportPageResponse;
import com.devlink.post_service.dto.response.ReportResponse;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.service.ReportService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping
    public ResponseEntity<ApiResponse<ReportPageResponse>> getReports(
            @RequestParam TargetType targetType,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") @Max(20) int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                reportService.getReports(targetType, status, page, size),
                "OK"
        ));
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse<ReportAdminDetailResponse>> getReportAdminDetail(
            @PathVariable Long reportId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                reportService.getReportAdminDetail(reportId),
                "OK"
        ));
    }

    @PutMapping("/{reportId}/review")
    public ResponseEntity<ApiResponse<ReportResponse>> review(
            @PathVariable Long reportId,
            @Valid @RequestBody ReportReviewRequest request
    ) {
        ReportResponse response = reportService.reviewReport(reportId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Report reviewed successfully"));
    }

    @DeleteMapping("/{reportId}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(
            @PathVariable Long reportId
    ) {
        reportService.deleteReport(reportId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Report deleted successfully"));
    }
}
