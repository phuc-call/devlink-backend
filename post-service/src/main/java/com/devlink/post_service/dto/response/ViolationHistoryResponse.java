package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.TargetType;
import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationHistoryResponse {
    private Long id;
    private Long reportId;
    private Long violatorId;
    private TargetType targetType;
    private Long targetId;
    private String reason;
    private Instant violationAt;
    private Instant penaltyStartAt;
    private Instant penaltyEndAt;
    private Integer violationCount;
    private Long restrictionId;
    private Instant createdAt;
}
