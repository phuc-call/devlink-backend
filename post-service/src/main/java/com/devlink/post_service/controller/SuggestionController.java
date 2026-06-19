package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.CreateSuggestionRequest;
import com.devlink.post_service.dto.request.RejectSuggestionRequest;
import com.devlink.post_service.dto.request.SuggestionOverviewRequest;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.enums.SuggestionStatus;
import com.devlink.post_service.service.SuggestionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static com.devlink.post_service.config.Constants.SUCCESS;

@RestController
@RequestMapping("/api/templates/suggestions")
@RequiredArgsConstructor
public class SuggestionController {

    private final SuggestionService suggestionService;

    @PostMapping
    public ResponseEntity<ApiResponse<SuggestionResponse>> createSuggestion(
            @RequestBody @Valid CreateSuggestionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(suggestionService.createSuggestion(request)));
    }

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<Page<SuggestionSummary>>> getAllPending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") @Max(50) int size) {
        return ResponseEntity.ok(ApiResponse.ok(suggestionService.getAllPendingForAdmin(page, size)));
    }

    @PutMapping("admin/{suggestionId}/approve")
    public ResponseEntity<ApiResponse<SuggestionActionResponse>> approveSuggestion(
            @PathVariable Long suggestionId) {
        return ResponseEntity.ok(ApiResponse.ok(suggestionService.approveSuggestion(suggestionId)));
    }

    @PutMapping("admin/{suggestionId}/reject")
    public ResponseEntity<ApiResponse<SuggestionActionResponse>> rejectSuggestion(
            @PathVariable Long suggestionId,
            @RequestBody @Valid RejectSuggestionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(suggestionService.rejectSuggestion(suggestionId, request)));
    }

    @PutMapping("/{suggestionId}/cancel")
    public ResponseEntity<ApiResponse<SuggestionActionResponse>> cancelSuggestion(
            @PathVariable Long suggestionId) {
        return ResponseEntity.ok(ApiResponse.ok(suggestionService.cancelSuggestion(suggestionId)));
    }

    @GetMapping("/{suggestionId}")
    public ResponseEntity<ApiResponse<SuggestionDetailResponse>> getDetailSuggestion(
            @PathVariable Long suggestionId,
            @RequestParam(value = "showInfoStatus", defaultValue = "false") boolean showInfoStatus
    ) {
        return ResponseEntity.ok(ApiResponse.ok(suggestionService.getSuggestionDetail(suggestionId, showInfoStatus)));
    }

    @GetMapping("/admin/grouped")
    public ResponseEntity<ApiResponse<Map<String, SuggestionGroupResponse>>> getGroupedByStatus() {
        return ResponseEntity.ok(ApiResponse.ok(suggestionService.getGroupedByStatus()));
    }

    @GetMapping("/admin/group")
    public ResponseEntity<ApiResponse<Page<SuggestionSummary>>> getSuggestionsByStatus(
            @RequestParam SuggestionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") @Max(50) int size) {
        return ResponseEntity.ok(ApiResponse.ok(suggestionService.getSuggestionsByStatus(status, page, size)));
    }

    @DeleteMapping("/admin/{suggestionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSuggestion(@PathVariable Long suggestionId) {
        suggestionService.deleteSuggestion(suggestionId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Delete successful"));
    }

    @PostMapping("/admin/overview/template")
    public ResponseEntity<ApiResponse<List<PeriodOverviewRepose>>> overview(
            @RequestBody SuggestionOverviewRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(suggestionService.getOverviewSuggestion(request), SUCCESS)
        );
    }

}