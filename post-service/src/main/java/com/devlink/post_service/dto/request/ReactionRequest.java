package com.devlink.post_service.dto.request;

import com.devlink.post_service.entity.enums.ReactionType;
import com.devlink.post_service.entity.enums.TargetType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionRequest {
    @NotNull(message = "targetId is required")
    private Long targetId;

    @NotNull(message = "targetType is required")
    private TargetType targetType;

    @NotNull(message = "reactionType is required")
    private ReactionType reactionType;
}
