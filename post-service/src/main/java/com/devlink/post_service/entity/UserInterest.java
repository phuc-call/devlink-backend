package com.devlink.post_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Stores the accumulated interest score of a user for each tag.
 *
 * Score is incremented asynchronously every time the user interacts
 * with a post that contains the corresponding tag (via LIKE, VIEW, BOOKMARK, SHARE).
 *
 * A daily cron job reduces all scores by 5% (time-decay) so that
 * old interests gradually fade and recent ones take priority.
 *
 * Do NOT query user_interactions directly for feed generation.
 * That table stores raw event history and causes full-table-scans at scale.
 * This table is the materialized score — pre-aggregated, fast to query.
 */
@Entity
@Table(
    name = "user_interests",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_tag", columnNames = {"user_id", "tag"})
    },
    indexes = {
        @Index(name = "idx_ui_user_score", columnList = "user_id, score DESC")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Stored in lowercase to be consistent with PostTag (tags are lowercased on insert). */
    @Column(name = "tag", nullable = false, length = 50)
    private String tag;

    /** Uses Double (not Integer) to support the 0.95 multiplier of the time-decay job. */
    @Builder.Default
    @Column(name = "score", nullable = false)
    private Double score = 0.0;

    /** Timestamp of the last interaction — used for debugging and analytics only. */
    @Column(name = "last_interacted_at")
    private Instant lastInteractedAt;
}
