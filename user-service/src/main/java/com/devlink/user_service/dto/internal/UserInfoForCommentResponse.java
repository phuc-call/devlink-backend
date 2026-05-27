package com.devlink.user_service.dto.internal;

import lombok.Builder;
import lombok.Getter;

@Builder @Getter
public class UserInfoForCommentResponse {
    private Long   id;
    private String fullName;
    private String avatarUrl;
}
