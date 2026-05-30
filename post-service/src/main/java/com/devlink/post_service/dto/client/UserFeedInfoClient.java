package com.devlink.post_service.dto.client;

import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class UserFeedInfoClient {
    private Long id;
    private String fullName;
    private String avatarUrl;

    private Integer followerCount;
    private Integer followingCount;
    private Boolean isFollowing;
    private Boolean isFriend;
}
