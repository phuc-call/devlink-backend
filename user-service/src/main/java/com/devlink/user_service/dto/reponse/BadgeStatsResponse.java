package com.devlink.user_service.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeStatsResponse {
    private long none;
    private long popular;
    private long blueTick;
    private long redTick;
    private long total;
}