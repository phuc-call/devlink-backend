package com.devlink.post_service.dto.response;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminOverviewResponse {
    private long totalUsers;
    private long totalTagGroups;
    private long totalInterestRecords;
    private long totalPostViews;
    private List<TagFrequency> topTags;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TagFrequency {
        private String tag;
        private long count;
    }
}
