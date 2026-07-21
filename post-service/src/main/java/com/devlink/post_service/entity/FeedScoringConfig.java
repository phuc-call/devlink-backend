package com.devlink.post_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Stores admin-configurable parameters for the personalized feed scoring system.
 *
 * Each row represents a single named configuration entry (key-value pair).
 * Values are cached in Redis after each admin update to minimize DB reads.
 *
 * Known config keys and their purpose:
 *   score.view               - points added per VIEW interaction
 *   score.like               - points added per LIKE interaction
 *   score.bookmark           - points added per BOOKMARK interaction
 *   score.share              - points added per SHARE interaction
 *   feed.top_tags_limit      - how many top tags to fetch from DB for feed generation
 *   feed.min_like_threshold  - minimum like count for a post to appear in feed
 *   feed.fallback_threshold  - minimum result count before falling back to trending
 *   interest.decay_rate      - multiplier applied per elapsed day since last interaction
 */
@Entity
@Table(
    name = "feed_scoring_config",
    indexes = {
        @Index(name = "idx_fsc_key", columnList = "config_key")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedScoringConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "config_key", nullable = false, unique = true, length = 50)
    private String configKey;

    @Column(name = "config_value", nullable = false)
    private Double configValue;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** ID of the admin who last changed this entry. */
    @Column(name = "updated_by")
    private Long updatedBy;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
