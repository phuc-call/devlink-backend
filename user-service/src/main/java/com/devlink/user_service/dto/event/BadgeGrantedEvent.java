package com.devlink.user_service.dto.event;

import com.devlink.user_service.entity.enums.BadgeType;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Builder
@Setter @NoArgsConstructor @AllArgsConstructor
public class BadgeGrantedEvent {
    private String eventId; //UUID-dedup post-service
    private Long userId;
    private BadgeType badgeType;
    private String grantedBy;
    private String reason;
    private LocalDateTime occurredAt;
}
