package com.devlink.post_service.dto.client;

import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class UserFeedInfoResponse {
    private Long id;

    private String fullName;
    private String avatarUrl;
    private String badge;
    private Integer followerCount;
    private Integer followingCount;
    private Boolean isFollowing;  // current user có follow author không
    private Boolean isFriend;
}
