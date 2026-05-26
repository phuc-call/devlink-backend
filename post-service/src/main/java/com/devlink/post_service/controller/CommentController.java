package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.CreateCommentRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.CommentResponse;
import com.devlink.post_service.dto.response.CommentSummaryResponse;
import com.devlink.post_service.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @Valid @RequestBody CreateCommentRequest request
    ) {
        CommentResponse response = commentService.createComment(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<CommentResponse>builder()
                        .success(true)
                        .message("Your comment has been noted")
                        .data(response)
                        .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CommentSummaryResponse>>> getComments(
            @RequestParam Long postId,
            @RequestParam(defaultValue = "0") int page
    ) {
        Page<CommentSummaryResponse> response = commentService.getComments(postId, page);
        return ResponseEntity.ok(
                ApiResponse.<Page<CommentSummaryResponse>>builder()
                        .success(true)
                        .message("Lấy danh sách bình luận thành công")
                        .data(response)
                        .build()
        );
    }
}