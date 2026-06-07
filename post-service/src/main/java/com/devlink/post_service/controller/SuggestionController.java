package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.CreateSuggestionRequest;
import com.devlink.post_service.dto.request.RejectSuggestionRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.SuggestionActionResponse;
import com.devlink.post_service.dto.response.SuggestionResponse;
import com.devlink.post_service.dto.response.SuggestionSummary;
import com.devlink.post_service.service.SuggestionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

}