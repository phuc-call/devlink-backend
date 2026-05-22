package com.devlink.post_service.dto.request;

import com.devlink.post_service.entity.enums.AiModerationStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ModerationResult {
    private AiModerationStatus status;
    private Double score;
    private String reason;
}