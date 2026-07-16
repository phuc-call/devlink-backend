package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.CommentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentSummaryResponse {

    private Long id;
    private Long postId;
    private Long authorId;
    private Long parentCommentId;
    private String content;
    private CommentStatus status;
    private Long replyCount;
    private Long likeCount;
    private String mentionedName;
    private Instant createdAt;
    private String userName;
    private String avatarUrl;
}