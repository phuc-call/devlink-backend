package com.devlink.post_service.dto.event;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserProfileEvent {
    private Long userId;
    private String userName;
    private String avatarUrl;
    private String language;
}
