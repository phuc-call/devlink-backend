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
@RequestMapping("/api/posts/reports")
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
