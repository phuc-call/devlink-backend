package com.devlink.post_service.dto.response;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminUserDetailResponse {
    private Long userId;
    private String userName;
    private String avatarUrl;
    private List<UserInterestResponse> interests;
    private List<AssignedTagGroupResponse> tagGroups;
    private Long viewedPostCount;
    private Long totalInteractions;
    private Instant lastActivity;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UserInterestResponse {
        private String tag;
        private Double score;
        private Instant lastInteractedAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AssignedTagGroupResponse {
        private Long groupId;
        private String groupName;
        private List<String> tags;
        private String assignmentType;
        private Instant assignedAt;
    }
}
