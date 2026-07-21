package com.devlink.post_service.repository;

import com.devlink.post_service.entity.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserInterestRepository extends JpaRepository<UserInterest, Long> {

    /**
     * Returns the top N tags with the highest interest score for the given user.
     *
     * Uses a native query with LIMIT because JPQL does not support it directly.
     * The composite index (user_id, score DESC) ensures this runs in O(log N).
     *
     * @param userId the user whose interests to retrieve
     * @param limit  maximum number of tags to return (e.g. 3 for feed generation)
     */
    @Query(value = "SELECT ui.tag FROM user_interests ui " +
                   "WHERE ui.user_id = :userId " +
                   "ORDER BY ui.score DESC " +
                   "LIMIT :limit",
           nativeQuery = true)
    List<String> findTopTagsByUserId(@Param("userId") Long userId, @Param("limit") int limit);

    /**
     * UPSERT with inline time-decay: inserts a new (userId, tag) row or updates the
     * existing score by first applying decay proportional to days elapsed, then adding
     * the new interaction score.
     *
     * Formula on UPDATE:
     *   new_score = stored_score * POW(decayRate, days_since_last_interaction) + scoreToAdd
     *
     * This replaces the nightly cron job — decay is applied continuously,
     * per-user, only when they actually interact with content.
     *
     * @param userId    the user who performed the interaction
     * @param tag       the tag to credit
     * @param score     the amount to add after decay is applied
     * @param decayRate the configured decay multiplier (e.g. 0.95 for 5%/day)
     */
    @Modifying
    @Query(value = "INSERT INTO user_interests (user_id, tag, score, last_interacted_at) " +
                   "VALUES (:userId, :tag, :score, NOW()) " +
                   "ON DUPLICATE KEY UPDATE " +
                   "score = (score * POW(:decayRate, DATEDIFF(NOW(), last_interacted_at))) + :score, " +
                   "last_interacted_at = NOW()",
           nativeQuery = true)
    void upsertScore(@Param("userId") Long userId,
                     @Param("tag") String tag,
                     @Param("score") double score,
                     @Param("decayRate") double decayRate);

    Optional<UserInterest> findByUserIdAndTag(Long userId, String tag);
}
