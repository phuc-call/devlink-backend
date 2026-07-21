package com.devlink.post_service.dto.response;

import lombok.*;

import java.time.Instant;

/**
 * Read-only projection of a single feed_scoring_config row for the admin UI.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedScoringConfigResponse {

    private Long id;

    /** Machine-readable key, e.g. "score.like" */
    private String configKey;

    /** Current numeric value */
    private Double configValue;

    /** Human-readable description shown in the admin panel */
    private String description;

    private Instant updatedAt;

    /** ID of the admin who last changed this entry */
    private Long updatedBy;
}
