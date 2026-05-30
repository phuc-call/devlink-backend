package com.devlink.post_service.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder @Getter @AllArgsConstructor @NoArgsConstructor
public class UserInfoForCommentClient {
    private Long   id;
    private String fullName;
    private String avatarUrl;
}
