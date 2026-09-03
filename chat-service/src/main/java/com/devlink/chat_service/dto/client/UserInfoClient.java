package com.devlink.chat_service.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder @Getter @AllArgsConstructor @NoArgsConstructor
public class UserInfoClient {
    private Long id;
    private String fullName;
    private String avatarUrl;
}
