package com.devlink.post_service.repository;

import com.devlink.post_service.entity.FeedScoringConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FeedScoringConfigRepository extends JpaRepository<FeedScoringConfig, Long> {

    Optional<FeedScoringConfig> findByConfigKey(String configKey);

    /**
     * Returns all config entries as a list.
     * Used on startup and after admin updates to rebuild the Redis cache.
     */
    @Query("SELECT f FROM FeedScoringConfig f ORDER BY f.configKey ASC")
    List<FeedScoringConfig> findAllOrderedByKey();
}
