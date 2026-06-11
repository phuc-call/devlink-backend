package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.ReportReason;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@AllArgsConstructor @NoArgsConstructor @Builder @Getter
public class ReportResponse {
    private Long id;
    private Long reporterId;
    private Long targetId;
    private TargetType targetType;
    private ReportReason reason;
    private String description;
    private ReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
