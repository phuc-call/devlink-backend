package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.ReportReason;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor @NoArgsConstructor @Builder @Getter
public class ReportListResponse {
    private List<ReportItem> items;
    private Long nextCursor;   // null = hết data
    private boolean hasMore;

    @AllArgsConstructor @NoArgsConstructor @Builder @Getter
    public static class ReportItem {
        private Long reportId;
        private Long targetId;
        private TargetType targetType;
        private Long violatorUserId;   // userId của người vi phạm
        private ReportReason reason;
        private String description;
        private ReportStatus status;
        private Long reporterId;
        private LocalDateTime createdAt;
    }
}