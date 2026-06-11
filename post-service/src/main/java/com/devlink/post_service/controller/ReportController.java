package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.CreateReportRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.ReportResponse;
import com.devlink.post_service.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PutMapping("/{reportId}/review")
    public ResponseEntity<ApiResponse<ReportResponse>> review(
            @PathVariable Long reportId,
            @Valid @RequestBody ReportReviewRequest request
    ) {
        ReportResponse response = reportService.reviewReport(reportId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Report reviewed successfully"));
    }
}
