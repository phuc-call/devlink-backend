package com.devlink.post_service.dto.client;

import lombok.Data;

@Data
public class BadgeVideoLimitClient {
    private String badgeType;
    private Integer maxSeconds;
    private Integer maxCount;
}