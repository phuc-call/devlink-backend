package com.devlink.post_service.dto.event;

import com.devlink.post_service.entity.enums.RestrictionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportReviewedEvent {
    private Long reportId;
    private Long targetUserId;
    private Long reporterId;
    private boolean approved;
    private RestrictionType restrictionType;
    private String reviewNote;
    private String reviewedBy;
    private Instant reviewedAt;
    private Instant restrictedUntil;

    private Long targetId;
    private String targetType;
    private String reason;
    private String description;
}