package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.CreateReportRequest;
import com.devlink.post_service.dto.request.ReportReviewRequest;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.service.ReportService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/posts/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReportResponse>> report(
            @Valid @RequestBody CreateReportRequest request
    ) {
        ReportResponse response = reportService.createOrUpdateReport(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Report submitted successfully"));
    }

    @PutMapping("admin/{reportId}/review")
    public ResponseEntity<ApiResponse<ReportResponse>> review(
            @PathVariable Long reportId,
            @Valid @RequestBody ReportReviewRequest request
    ) {
        ReportResponse response = reportService.reviewReport(reportId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Report reviewed successfully"));
    }

    @GetMapping("/admin")
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

    @DeleteMapping("/admin/{reportId}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(
            @PathVariable Long reportId
    ) {
        reportService.deleteReport(reportId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Report deleted successfully"));
    }

    @GetMapping("/notif-detail")
    public ResponseEntity<ApiResponse<ReportDetailResponse>> getReportDetail(
            @RequestParam Long notificationId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                reportService.getReportDetail(notificationId),
                "OK"
        ));
    }

    @GetMapping("/my-violations")
    public ResponseEntity<ApiResponse<List<MyViolationResponse>>> getMyViolations() {
        return ResponseEntity.ok(ApiResponse.ok(
                reportService.getMyViolations(),
                "OK"
        ));
    }
}
