package com.devlink.post_service.dto.procedure;

import com.devlink.post_service.entity.enums.ReportReason;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;

import java.time.LocalDateTime;

public interface ReportItemProjection {
    Long getReportId();
    Long getTargetId();
    TargetType getTargetType();
    Long getViolatorUserId();
    Long getReporterId();
    ReportReason getReason();
    String getDescription();
    ReportStatus getStatus();
    LocalDateTime getCreatedAt();
}