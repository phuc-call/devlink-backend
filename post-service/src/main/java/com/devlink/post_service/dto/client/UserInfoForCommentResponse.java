package com.devlink.post_service.dto.client;

import lombok.Builder;
import lombok.Getter;

@Builder @Getter
public class UserInfoForCommentResponse {
    private Long   id;
    private String fullName;
    private String avatarUrl;
}
