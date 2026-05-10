package com.devlink.user_service.dto.reponse;

import com.devlink.user_service.entity.enums.FollowStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @Builder
public class FollowUserResponse {
    Long userId;
    String fullName;
    String avatarUrl;
    FollowStatus status;
}
