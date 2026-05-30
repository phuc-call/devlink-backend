package com.devlink.post_service.dto.procedure;

import java.time.Instant;

public interface FeedPostProcedureResult {
    Long getId();
    Long getAuthorId();
    String getContent();
    String getStatus();
    String getVisibility();
    String getPostType();
    Long getViewCount();
    Boolean getIsPinned();
    String getAiModerationStatus();
    Instant getCreatedAt();
    Instant getUpdatedAt();
    Long getCommentCount();
}