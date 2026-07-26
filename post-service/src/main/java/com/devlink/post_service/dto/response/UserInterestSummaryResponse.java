package com.devlink.post_service.dto.response;

import lombok.*;

import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserInterestSummaryResponse {
    private Long id;
    private String tag;
    private Double score;
    private Instant lastInteractedAt;
}
