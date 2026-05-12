package com.devlink.user_service.dto.reponse;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder @Getter @Setter
public class NotificationBrithDay {
    Long userId;
    String fullName;
    String avatarUrl;
    String message;
}
