package com.devlink.post_service.dto.procedure;

import java.time.LocalDateTime;

/**
 * Mapped from get_replies_by_comment stored procedure.
 * Fetches only display fields to avoid full entity load.
 */
public interface CommentReplyProcedureResult {
    Long getId();
    Long getPostId();
    Long getCommentId();
    Long getParentReplyId();
    Long getAuthorId();
    String getContent();
    String getStatus();
    Long getLikeCount();
    LocalDateTime getCreatedAt();
    LocalDateTime getUpdatedAt();
}