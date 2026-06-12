package com.devlink.post_service.dto.redis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountRestrictionRedis {
    private Long targetId;
    private String targetType;
    private String restrictionType;
    private String restrictedBy;
    private String reason;
    private Instant restrictedUntil;
}
