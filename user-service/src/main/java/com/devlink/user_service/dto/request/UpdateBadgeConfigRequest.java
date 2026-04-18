package com.devlink.user_service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class UpdateBadgeConfigRequest {
    @Min(value = 1)
    private Integer popularityThreshold;
    @Min(value = 1)
    private Integer bluetickThreshold;
    @Min(value = 1) @Max(value = 100)
    private Integer completionThreshold;

    @Min(1) @Max(100)
    private Integer minCompletionPercent;

}
