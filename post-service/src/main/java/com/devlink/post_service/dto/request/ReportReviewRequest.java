package com.devlink.post_service.dto.request;
// Request from Admin
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportReviewRequest {
    private Long reportId;
    private boolean approved;
    private String reviewNote;
    private String restrictionType;
    private Integer restrictionDays;
}
