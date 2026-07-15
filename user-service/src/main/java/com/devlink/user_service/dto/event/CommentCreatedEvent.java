package com.devlink.user_service.dto.event;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentCreatedEvent {

    private Long actorId;
    private Long receiverId;

    private Long postId;
    private Long commentId;

    private LocalDateTime createdAt;
}
