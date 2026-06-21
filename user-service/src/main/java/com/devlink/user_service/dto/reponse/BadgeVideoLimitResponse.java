package com.devlink.user_service.dto.reponse;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
@Getter
@Builder
public class BadgeVideoLimitResponse {
    private String badgeType;
    private Integer maxSeconds;
    private Integer maxCount;
    private LocalDateTime updatedAt;
    private Long updatedBy;
}
