package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.CommentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class CommentProjection {
    private Long id;
    private Long postId;
    private Long authorId;
    private String content;
    private CommentStatus status;
    private Long replyCount;
    private Long likeCount;
    private Instant createdAt;
}
