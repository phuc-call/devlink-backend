package com.devlink.post_service.dto.client;

import com.devlink.post_service.entity.enums.BadgeType;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class UserFeedInfoClient {
    private Long id;
    private String fullName;
    private String avatarUrl;
    private BadgeType badge;

    private Integer followerCount;
    private Integer followingCount;
    private Boolean isFollowing;
    private Boolean isFriend;
}
