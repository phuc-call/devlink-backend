package com.devlink.post_service.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request body for updating a single feed scoring config entry.
 * Admin must supply the exact config_key and the new numeric value.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedScoringConfigRequest {
    @NotBlank(message = "Config key must not be blank")
    @Size(max = 50, message = "Config key must not exceed 50 characters")
    private String configKey;

    @NotNull(message = "Config value must not be null")
    @DecimalMin(value = "0.01", message = "Config value must be at least 0.01")
    @DecimalMax(value = "100.0", message = "Config value must not exceed 100")
    private Double configValue;
}
