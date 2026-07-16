package com.devlink.user_service.dto.event;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserProfileUpdatedEvent {
    private Long userId;
    private String userName;
    private String avatarUrl;
    private String language;
}
