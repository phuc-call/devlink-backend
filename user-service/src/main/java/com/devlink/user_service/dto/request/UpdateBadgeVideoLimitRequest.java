package com.devlink.user_service.dto.request;

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
public class UpdateBadgeVideoLimitRequest {

    @NotNull(message = "Max seconds must not be null")
    @Min(value = 1, message = "Max seconds must be greater than 0")
    private Integer maxSeconds;

    @NotNull(message = "Max count must not be null")
    @Min(value = 1, message = "Max count must be greater than 0")
    private Integer maxCount;
}
