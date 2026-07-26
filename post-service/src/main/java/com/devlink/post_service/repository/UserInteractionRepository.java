package com.devlink.post_service.repository;

import com.devlink.post_service.entity.UserInteraction;
import com.devlink.post_service.entity.enums.ActionType;
import com.devlink.post_service.entity.enums.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserInteractionRepository extends JpaRepository<UserInteraction, Long> {

    boolean existsByUserIdAndTargetIdAndTargetTypeAndAction(
            Long userId, Long targetId, TargetType targetType, ActionType action);

    void deleteByUserIdAndTargetIdAndTargetTypeAndAction(
            Long userId, Long targetId, TargetType targetType, ActionType action);

    List<UserInteraction> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<UserInteraction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Returns target post IDs that a user has viewed, paginated */
    @Query(value = "SELECT i.target_id FROM user_interactions i " +
                   "WHERE i.user_id = :userId AND i.target_type = 'POST' AND i.action = 'VIEW' " +
                   "ORDER BY i.created_at DESC",
           countQuery = "SELECT COUNT(*) FROM user_interactions i WHERE i.user_id = :userId AND i.target_type = 'POST' AND i.action = 'VIEW'",
           nativeQuery = true)
    Page<Long> findViewedPostIdsByUserId(@Param("userId") Long userId, Pageable pageable);

    /** Returns ALL viewed post IDs (unpaginated) — use only for media queries where we need the full set */
    @Query(value = "SELECT DISTINCT i.target_id FROM user_interactions i " +
                   "WHERE i.user_id = :userId AND i.target_type = 'POST' AND i.action = 'VIEW' " +
                   "ORDER BY i.created_at DESC LIMIT 500",
           nativeQuery = true)
    List<Long> findAllViewedPostIdsByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT COUNT(*) FROM user_interactions i WHERE i.user_id = :userId AND i.target_type = 'POST' AND i.action = 'VIEW'",
           nativeQuery = true)
    long countViewsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(i) FROM UserInteraction i WHERE i.userId = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT MAX(i.created_at) FROM user_interactions i WHERE i.user_id = :userId",
           nativeQuery = true)
    Optional<java.time.Instant> findLastActivityByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT COUNT(*) FROM user_interactions WHERE target_type = 'POST' AND action = 'VIEW'",
           nativeQuery = true)
    long countAllViews();
}
