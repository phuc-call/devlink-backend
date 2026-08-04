package com.devlink.post_service.repository;

import com.devlink.post_service.entity.ViolationPenaltyConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ViolationPenaltyConfigRepository extends JpaRepository<ViolationPenaltyConfig, Long> {

    @Query("""
        SELECT c FROM ViolationPenaltyConfig c
        WHERE c.targetType = :targetType
          AND c.offenseNumber = :offenseNumber
          AND c.active = true
          AND (c.reason = :reason OR c.reason = 'ALL')
        ORDER BY CASE WHEN c.reason = :reason THEN 0 ELSE 1 END
        LIMIT 1
    """)
    Optional<ViolationPenaltyConfig> findApplicable(
            @Param("targetType") String targetType,
            @Param("reason") String reason,
            @Param("offenseNumber") int offenseNumber
    );

    @Query("""
        SELECT c FROM ViolationPenaltyConfig c
        WHERE c.targetType = :targetType
          AND c.offenseNumber >= :offenseNumber
          AND c.active = true
          AND (c.reason = :reason OR c.reason = 'ALL')
        ORDER BY c.offenseNumber ASC
        LIMIT 1
    """)
    Optional<ViolationPenaltyConfig> findApplicableFallback(
            @Param("targetType") String targetType,
            @Param("reason") String reason,
            @Param("offenseNumber") int offenseNumber
    );

    List<ViolationPenaltyConfig> findAllByOrderByTargetTypeAscOffenseNumberAsc();
}
