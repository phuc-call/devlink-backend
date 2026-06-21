package com.devlink.user_service.dto.reponse;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BadgeConfigResponse {
    private Long id;
    private Integer popularThreshold;
    private Integer bleuTickThreshold;
    private Integer minCompletionPercent;
    private Integer blueTickPendingRatio;
    private Integer gracePeriodDays;
    private Boolean isActive;
    private LocalDateTime updatedAt;
    private Long updatedBy;
}