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

    /**
     * The config key to update. Must match one of the known keys in feed_scoring_config.
     * Example: "score.like", "feed.top_tags_limit", "interest.decay_rate"
     */
    @NotBlank(message = "Config key must not be blank")
    @Size(max = 50, message = "Config key must not exceed 50 characters")
    private String configKey;

    /**
     * New value for the config entry.
     *
     * Constraints:
     *   - Must be greater than 0 (no zero or negative scores/thresholds)
     *   - Must not exceed 100 (prevents absurd scoring weights)
     *   - Decay rate (interest.decay_rate) should stay between 0.01 and 1.0 —
     *     validated at service layer because it depends on which key is being updated.
     */
    @NotNull(message = "Config value must not be null")
    @DecimalMin(value = "0.01", message = "Config value must be at least 0.01")
    @DecimalMax(value = "100.0", message = "Config value must not exceed 100")
    private Double configValue;
}
