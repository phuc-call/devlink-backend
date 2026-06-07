package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.CreateCommentRequest;
import com.devlink.post_service.dto.request.UpdateCommentRequest;
import com.devlink.post_service.dto.response.CommentResponse;
import com.devlink.post_service.dto.response.CommentSummaryResponse;
import com.devlink.post_service.entity.enums.CommentType;
import org.springframework.data.domain.Page;
/**
 * Implementation of {@link CommentService}.
 * Handles comment and reply lifecycle: create, read, update, delete.
 */
public interface CommentService {
    /**
     * Create a new comment on a post
     * validation post existence,user lock restriction, add AI moderation before saving
     *
     * @param request
     * @return
     */
    CommentResponse createComment(CreateCommentRequest request);


    Page<CommentSummaryResponse> getComments(Long postId, int page, int size);
    /**
     * Delete a comment or reply by ID
     * Only the author can delete their own reply/comment
     * Deleting a comment also cascades to all its reply
     *
     * @param id
     * @param type
     */
    void delete(Long id, CommentType type);
     CommentResponse update(Long id, UpdateCommentRequest request);
}
