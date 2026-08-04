package com.devlink.post_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PenalizedUserResponse {
    private Long userId;
    private String userName;
    private String avatarUrl;
    private Instant lastViolationAt;
}
