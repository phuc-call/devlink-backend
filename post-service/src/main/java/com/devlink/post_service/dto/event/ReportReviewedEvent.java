package com.devlink.post_service.dto.event;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportReviewedEvent {
    private Long reportId;
    private Long targetUserId;
    private Long reporterId;
    private boolean approved;
    private String restrictionType;
    private String reviewNote;
    private String reviewedBy;
    private Instant reviewedAt;
    private Instant restrictedUntil;
}