package com.devlink.post_service.dto.response;


import com.devlink.post_service.entity.enums.AiModerationStatus;
import com.devlink.post_service.entity.enums.CommentStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentResponse {

    private Long id;
    private Long postId;
    private Long authorId;
    private Long parentCommentId;
    private String content;
    private CommentStatus status;
    private AiModerationStatus aiModerationStatus;
    private LocalDateTime createdAt;
}