package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.AiModerationStatus;
import com.devlink.post_service.entity.enums.CommentStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentReplyResponse {
    private Long id;
    private Long postId;
    private Long commentId;       // top-level comment gốc
    private Long parentReplyId;   // reply cha trực tiếp
    private Long authorId;
    private String content;
    private CommentStatus status;
    private AiModerationStatus aiModerationStatus;
    private Long likeCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}