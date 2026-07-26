package com.devlink.post_service.dto.response;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminUserResponse {
    private Long userId;
    private String userName;
    private String avatarUrl;
    private Integer interestCount;
    private List<String> topInterests;
    private Instant lastActivity;
    private Long viewedPostCount;
}
