package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.ReportReason;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder @Getter @AllArgsConstructor @NoArgsConstructor
public class ReportItemResponse {
    private Long reportId;
    private Long targetId;
    private TargetType targetType;

    private Long violatorUserId;
    private String violatorName;

    private Long reporterId;
    private String reporterName;

    private ReportReason reason;
    private String description;
    private ReportStatus status;
    private LocalDateTime createdAt;
}