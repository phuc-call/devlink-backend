package com.devlink.user_service.dto.response;

import lombok.*;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationBrithDay {
    Long userId;
    String fullName;
    String avatarUrl;

    public String getMessage() {
        return "Today is " + fullName + "'s birthday, please give him the best wishes";
    }
}
