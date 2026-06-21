package com.devlink.user_service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBadgeConfigRequest {

    @NotNull(message = "Popular threshold must not be null")
    @Min(value = 1, message = "Popular threshold must be greater than 0")
    private Integer popularThreshold;

    @NotNull(message = "Blue tick threshold must not be null")
    @Min(value = 1, message = "Blue tick threshold must be greater than 0")
    private Integer bleuTickThreshold;

    @NotNull(message = "Min completion percent must not be null")
    @Min(value = 0, message = "Min completion percent must be between 0 and 100")
    @Max(value = 100, message = "Min completion percent must be between 0 and 100")
    private Integer minCompletionPercent;

    @NotNull(message = "Blue tick pending ratio must not be null")
    @Min(value = 0, message = "Blue tick pending ratio must be between 0 and 100")
    @Max(value = 100, message = "Blue tick pending ratio must be between 0 and 100")
    private Integer blueTickPendingRatio;

    @NotNull(message = "Grace period days must not be null")
    @Min(value = 1, message = "Grace period days must be greater than 0")
    private Integer gracePeriodDays;

    public void validate() {
        if (bleuTickThreshold <= popularThreshold) {
            throw new IllegalArgumentException("Blue tick threshold must be strictly greater than popular threshold");
        }
    }
}
