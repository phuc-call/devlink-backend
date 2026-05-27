package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.CreateCommentRequest;
import com.devlink.post_service.dto.request.UpdateCommentRequest;
import com.devlink.post_service.dto.response.CommentResponse;
import com.devlink.post_service.dto.response.CommentSummaryResponse;
import com.devlink.post_service.entity.enums.CommentType;
import org.springframework.data.domain.Page;

public interface CommentService {
    CommentResponse createComment(CreateCommentRequest request);
    Page<CommentSummaryResponse> getComments(Long postId, int page);

    void delete(Long id, CommentType type);
     CommentResponse update(Long id, UpdateCommentRequest request);
}
