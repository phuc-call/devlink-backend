package com.devlink.post_service.dto.redis;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportNotificationRedis {
    private Long reportId;
    private Long reporterId;
    private Long targetId;
    private String targetType;
    private String reason;
    private String description;
}