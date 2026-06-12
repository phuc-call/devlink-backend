package com.devlink.user_service.dto.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReportReviewedEvent {
    private Long reportId;
    private Long targetUserId;
    private Long reporterId;
    @JsonProperty("approved")
    private boolean approved;
    private String restrictionType;
    private String reviewNote;
    private String reviewedBy;
    private Instant reviewedAt;
    private Instant restrictedUntil;
}