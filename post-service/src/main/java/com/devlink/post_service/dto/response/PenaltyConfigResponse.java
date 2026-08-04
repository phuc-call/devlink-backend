package com.devlink.post_service.dto.response;

import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PenaltyConfigResponse {
    private Long id;
    private String targetType;
    private String reason;
    private Integer offenseNumber;
    private Integer penaltyDays;
    private Boolean permanent;
    private Boolean active;
    private Long updatedBy;
    private Instant updatedAt;
    private Long createdBy;
    private Instant createdAt;
    private String adminName;
    private String adminAvatarUrl;
}
