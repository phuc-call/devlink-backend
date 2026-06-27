package com.devlink.user_service.dto.response;

import com.devlink.user_service.entity.enums.BadgeType;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class UserFeedInfoResponse {
    private Long id;

    private String fullName;
    private String avatarUrl;
    private BadgeType badge;
    private Integer followerCount;
    private Integer followingCount;
    private Boolean isFollowing;
    private Boolean isFriend;
}
