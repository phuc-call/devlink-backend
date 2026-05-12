package com.devlink.user_service.dto.reponse;

import lombok.*;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
public class UserSearchResponse {
    Long userId;
    String fullName;
    String avatarUrl;
}
