package com.devlink.user_service.dto.response;

import lombok.*;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
public class UserSearchResponse {
    Long userId;
    String fullName;
    String avatarUrl;
    boolean isBlocked;
}
