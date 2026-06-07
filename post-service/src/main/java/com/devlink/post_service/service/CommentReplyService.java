package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.CreateCommentReplyRequest;
import com.devlink.post_service.dto.response.CommentReplyResponse;
import com.devlink.post_service.dto.response.CommentReplySummaryResponse;
import org.springframework.data.domain.Page;

public interface CommentReplyService {
    /**
     * Create a new comment reply for a comment or another reply a post
     * validation the parent comment optional parent reply thread consistency,
     * and applies AI moderation before saving.
     * @param request
     * @return
     */
    CommentReplyResponse createReply(CreateCommentReplyRequest request);
    Page<CommentReplySummaryResponse> getReplies(Long commentId, int page,int size);

}
