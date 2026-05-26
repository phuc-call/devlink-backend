package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.CommentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class CommentSummaryResponse {

    private Long id;
    private Long postId;
    private Long authorId;
    private Long parentCommentId;
    private String content;
    private CommentStatus status;
    private Long likeCount;
    private LocalDateTime createdAt;
}