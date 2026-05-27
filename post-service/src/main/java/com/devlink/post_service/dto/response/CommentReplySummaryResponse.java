package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.CommentStatus;
import com.devlink.post_service.entity.enums.CommentType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentReplySummaryResponse {
    private Long id;
    private Long postId;
    private Long commentId;       // top-level comment gốc
    private Long parentReplyId;   // reply cha trực tiếp
    private Long authorId;
    private String content;
    private CommentStatus status;
    private Long likeCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private CommentType type;

    // Thông tin người reply từ user-service
    private String fullName;
    private String avatarUrl;
}