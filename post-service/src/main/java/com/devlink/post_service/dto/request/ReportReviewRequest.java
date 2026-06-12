package com.devlink.post_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Request from Admin
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportReviewRequest {
    private boolean approved;
    private String reviewNote;
    private boolean permanent;
}
