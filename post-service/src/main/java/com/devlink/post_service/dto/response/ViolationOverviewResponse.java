package com.devlink.post_service.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationOverviewResponse {
    private long totalViolations;
    private long activeViolations;
    private long totalReports;
    private long pendingReports;
    private long resolvedReports;
    private long rejectedReports;
}
