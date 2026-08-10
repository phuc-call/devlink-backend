package com.devlink.user_service.dto.response;

import com.devlink.user_service.entity.enums.BadgeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserOverviewResponse {
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private BadgeType badge;
    private int followerCount;
    private int followingCount;
    private int newFollowersThisWeek;
    private int groupCount;
    private int unreadNotificationCount;
}
