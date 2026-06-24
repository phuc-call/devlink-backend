package com.devlink.post_service.controller;

import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.VideoFeedPageResponse;
import com.devlink.post_service.dto.response.VideoFeedResponse;
import com.devlink.post_service.service.VideoFeedService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.devlink.post_service.config.Constants.SUCCESS;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
@Slf4j
public class VideoFeedController {

    private final VideoFeedService videoFeedService;

    @GetMapping("/short")
    public ResponseEntity<ApiResponse<VideoFeedPageResponse>> getShortVideoFeed(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(20) int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(videoFeedService.getShortVideoFeed(page, size), SUCCESS)
        );
    }

    @GetMapping("/long")
    public ResponseEntity<ApiResponse<VideoFeedPageResponse>> getLongVideoFeed(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(20) int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(videoFeedService.getLongVideoFeed(page, size), SUCCESS)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VideoFeedResponse>> getVideoDetail(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(videoFeedService.getVideoDetail(id), SUCCESS)
        );
    }
}