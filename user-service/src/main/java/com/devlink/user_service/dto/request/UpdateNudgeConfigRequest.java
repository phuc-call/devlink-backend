package com.devlink.user_service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateNudgeConfigRequest {

    private Boolean featureEnabled;
    @Min(value = 1, message = "Completion threshold must be at least 1")
    @Max(value = 100, message = "Completion threshold must be at most 100")
    private Integer completionThreshold;

    @Min(value = 1, message = "Language weight must be at least 1")
    @Max(value = 50, message = "Language weight must be at most 50")
    private Integer languageWeight;

    @Min(value = 1, message = "First nudge days must be at least 1")
    private Integer firstNudgeDays;

    @Min(value = 1, message = "Second nudge days must be at least 1")
    private Integer secondNudgeDays;

    @Min(value = 1, message = "Third nudge days must be at least 1")
    private Integer thirdNudgeDays;
}