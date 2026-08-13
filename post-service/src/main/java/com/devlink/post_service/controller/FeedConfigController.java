package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.FeedScoringConfigRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.FeedScoringConfigResponse;

import com.devlink.post_service.service.FeedConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.devlink.post_service.config.Constants.SUCCESS;

@RestController
@RequestMapping("/api/posts/admin/feed-config")
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
        FeedScoringConfigResponse updated = feedConfigService.updateConfig(request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Config updated successfully"));
    }
}
