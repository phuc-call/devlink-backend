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
    private Long updatedBy;
    private Instant updatedAt;
}
