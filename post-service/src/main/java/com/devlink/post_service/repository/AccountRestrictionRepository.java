package com.devlink.post_service.repository;

import com.devlink.post_service.entity.AccountRestriction;
import com.devlink.post_service.entity.enums.RestrictionType;
import feign.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRestrictionRepository extends JpaRepository<AccountRestriction, Long> {


    @Query("""
        SELECT COUNT(r) > 0 FROM AccountRestriction r
        WHERE r.userId = :userId
          AND r.restrictionType IN :types
          AND (r.restrictedUntil IS NULL OR r.restrictedUntil > :now)
        """)
    boolean existsActiveRestriction(
            @Param("userId") Long userId,
            @Param("types") List<RestrictionType> types,
            @Param("now") Instant now
    );

    boolean existsByUserIdAndRestrictionTypeAndRestrictedUntilIsNull(
            Long userId, String restrictionType);

    Optional<AccountRestriction> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("""
    SELECT r FROM AccountRestriction r
    WHERE r.userId = :userId
    ORDER BY r.createdAt DESC
    """)
    List<AccountRestriction> findAllByUserId(@Param("userId") Long userId);
}