package com.devlink.user_service.dto.event;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Builder @Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class BirthdayNotificationEvent {
    private Long birthdayUserId;
    private String fullName;
    private String avatarUrl;
    private List<Long> friendIds;
    private LocalDateTime birthdayDate;
}
