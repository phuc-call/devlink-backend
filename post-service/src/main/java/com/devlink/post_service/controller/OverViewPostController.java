package com.devlink.post_service.controller;

import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.CommentReplyNotificationResponse;
import com.devlink.post_service.dto.response.ReactHistoryResponse;
import com.devlink.post_service.service.OverViewPostService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts/overview")
@RequiredArgsConstructor
@Validated
public class OverViewPostController {

    private final OverViewPostService overViewPostService;

    @GetMapping("/react-history")
    public ResponseEntity<ApiResponse<Page<ReactHistoryResponse>>> getReactHistory(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        Page<ReactHistoryResponse> result = overViewPostService.getReactHistory(page, size);
        return ResponseEntity.ok(
                ApiResponse.<Page<ReactHistoryResponse>>builder()
                        .success(true)
                        .data(result)
                        .message(Constants.SUCCESS)
                        .build());
    }

    @GetMapping("/comment-reply-history")
    public ResponseEntity<ApiResponse<Page<CommentReplyNotificationResponse>>> getCommentReplyHistory(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(0) @Max(20) int size) {
        Page<CommentReplyNotificationResponse> result = overViewPostService.getCommentReplyHistory(page, size);
        return ResponseEntity.ok(
                ApiResponse.<Page<CommentReplyNotificationResponse>>builder()
                        .success(true)
                        .data(result)
                        .message(Constants.SUCCESS)
                        .build());
    }
}
