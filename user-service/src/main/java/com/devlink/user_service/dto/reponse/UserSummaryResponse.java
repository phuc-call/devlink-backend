package com.devlink.user_service.dto.reponse;

import com.devlink.user_service.entity.enums.BadgeType;
import com.devlink.user_service.entity.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResponse {
    private Long id;
    private String username;
    private String email;
    private BadgeType badge;
    private UserStatus status;
    private String avatarUrl;
}