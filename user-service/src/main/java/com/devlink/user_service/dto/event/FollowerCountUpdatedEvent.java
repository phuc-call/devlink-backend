package com.devlink.user_service.dto.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class FollowerCountUpdatedEvent {
    private String eventId;
    private Long userId;
    private Long followerCount;
    private LocalDateTime occurredAt;
}
