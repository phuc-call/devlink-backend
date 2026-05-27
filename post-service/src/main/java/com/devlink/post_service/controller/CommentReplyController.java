package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.CreateCommentReplyRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.CommentReplyResponse;
import com.devlink.post_service.dto.response.CommentReplySummaryResponse;
import com.devlink.post_service.service.CommentReplyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * dùng để tạo comment con và lâấy các thoại hội
 */
@RestController
@RequestMapping("/api/posts/comments/replies")
@RequiredArgsConstructor
public class CommentReplyController {

    private final CommentReplyService commentReplyService;

    @PostMapping
    public ResponseEntity<ApiResponse<CommentReplyResponse>> createReply(
            @Valid @RequestBody CreateCommentReplyRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                commentReplyService.createReply(request),
                "Comment reply successful"
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CommentReplySummaryResponse>>> getReplies(
            @RequestParam Long commentId,
            @RequestParam(defaultValue = "0") int page
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                commentReplyService.getReplies(commentId, page),
                "Get a list of successful replies"
        ));
    }
}