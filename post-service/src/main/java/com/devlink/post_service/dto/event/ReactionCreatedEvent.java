package com.devlink.post_service.dto.event;

import com.devlink.post_service.entity.enums.ReactionType;
import com.devlink.post_service.entity.enums.TargetType;
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
    private TargetType targetType;
    private ReactionType reactionType;

    private LocalDateTime createdAt;
}