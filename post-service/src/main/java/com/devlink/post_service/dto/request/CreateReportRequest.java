package com.devlink.post_service.dto.request;

import com.devlink.post_service.entity.enums.ReportReason;
import com.devlink.post_service.entity.enums.TargetType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@AllArgsConstructor @NoArgsConstructor @Getter @Setter @Builder
public class CreateReportRequest {
    @NotNull(message = "targetId is required")
    private Long targetId;

    @NotNull(message = "targetType is required")
    private TargetType targetType;

    @NotNull(message = "reason is required")
    private ReportReason reason;

    @Size(max = 500, message = "description must not exceed 500 characters")
    private String description;
}
