package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.CreateCommentReplyRequest;
import com.devlink.post_service.dto.response.CommentReplyResponse;
import com.devlink.post_service.dto.response.CommentReplySummaryResponse;
import org.springframework.data.domain.Page;

public interface CommentReplyService {
    CommentReplyResponse createReply(CreateCommentReplyRequest request);
    Page<CommentReplySummaryResponse> getReplies(Long commentId, int page);

}
