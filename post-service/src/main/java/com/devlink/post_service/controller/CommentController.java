package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.CreateCommentRequest;
import com.devlink.post_service.dto.request.UpdateCommentRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.CommentResponse;
import com.devlink.post_service.dto.response.CommentSummaryResponse;
import com.devlink.post_service.entity.enums.CommentType;
import com.devlink.post_service.service.CommentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") @Max(50) int size
    ) {
        Page<CommentSummaryResponse> response = commentService.getComments(postId, page, size);
        return ResponseEntity.ok(
                ApiResponse.<Page<CommentSummaryResponse>>builder()
                        .success(true)
                        .message("Comments retrieved successfully")
                        .data(response)
                        .build()
        );
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @RequestParam CommentType type
    ) {
        commentService.delete(id, type);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa thành công"));
    }


    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommentResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCommentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                commentService.update(id, request),
                "Sửa thành công"
        ));
    }
}