package com.devlink.user_service.dto.reponse;

import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private Long userId;
    private String username;
    private String role;
}
