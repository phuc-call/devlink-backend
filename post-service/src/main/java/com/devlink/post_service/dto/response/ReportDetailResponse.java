package com.devlink.post_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDetailResponse {
    private Long reportId;
    private String targetType;
    private Long targetId;
    private String reason;
    private String description;

    private Object targetContent;
    private boolean contentDeleted;
}