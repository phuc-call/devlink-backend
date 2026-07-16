package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.CommentStatus;
import com.devlink.post_service.entity.enums.CommentType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

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
    private Instant createdAt;
    private Instant updatedAt;
    private CommentType type;
    private String mentionedName;

    // Thông tin người reply từ local user_profiles
    private String userName;
    private String avatarUrl;
}