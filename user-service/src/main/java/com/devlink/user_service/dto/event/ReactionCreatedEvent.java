package com.devlink.user_service.dto.event;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionCreatedEvent {

    private Long actorId;
    private Long receiverId;

    private Long targetId;
    private String targetType;
    private String reactionType;

    private LocalDateTime createdAt;
}