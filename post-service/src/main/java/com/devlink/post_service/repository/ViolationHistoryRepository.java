package com.devlink.post_service.repository;

import com.devlink.post_service.entity.ViolationHistory;
import com.devlink.post_service.entity.enums.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.devlink.post_service.dto.response.PenalizedUserResponse;
import com.devlink.post_service.dto.response.TopViolatorResponse;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ViolationHistoryRepository extends JpaRepository<ViolationHistory, Long> {

    @Query("SELECT COUNT(v) FROM ViolationHistory v WHERE v.violatorId = :userId AND v.targetType = :targetType")
    int countByViolatorIdAndTargetType(@Param("userId") Long userId, @Param("targetType") TargetType targetType);

    @Query("SELECT v FROM ViolationHistory v WHERE (:violatorId IS NULL OR v.violatorId = :violatorId) ORDER BY v.violationAt DESC")
    Page<ViolationHistory> findAllFiltered(@Param("violatorId") Long violatorId, Pageable pageable);

    @Query("SELECT COUNT(v) FROM ViolationHistory v")
    long countTotal();

    @Query("SELECT COUNT(v) FROM ViolationHistory v WHERE v.penaltyEndAt IS NULL OR v.penaltyEndAt > CURRENT_TIMESTAMP")
    long countActive();

    @Query("""
        SELECT new com.devlink.post_service.dto.response.PenalizedUserResponse(
            p.userId, p.userName, p.avatarUrl, MAX(v.violationAt)
        )
        FROM ViolationHistory v
        JOIN UserProfile p ON v.violatorId = p.userId
        WHERE v.targetType = :targetType 
        GROUP BY p.userId, p.userName, p.avatarUrl
        HAVING MAX(v.violationCount) = :violationCount
        ORDER BY MAX(v.violationAt) DESC
    """)
    Page<PenalizedUserResponse> findUsersByCurrentViolationCount(
        @Param("targetType") TargetType targetType, 
        @Param("violationCount") Integer violationCount, 
        Pageable pageable
    );

    @Query("SELECT COUNT(v) FROM ViolationHistory v WHERE v.targetType = :targetType")
    long countByTargetType(@Param("targetType") TargetType targetType);

    @Query("SELECT COUNT(DISTINCT v.violatorId) FROM ViolationHistory v WHERE v.targetType = :targetType")
    long countDistinctViolatorByTargetType(@Param("targetType") TargetType targetType);

    @Query("""
        SELECT new com.devlink.post_service.dto.response.TopViolatorResponse(
            p.userId, p.userName, p.avatarUrl, COUNT(v.id)
        )
        FROM ViolationHistory v
        JOIN UserProfile p ON v.violatorId = p.userId
        WHERE v.targetType = :targetType
        GROUP BY p.userId, p.userName, p.avatarUrl
        ORDER BY COUNT(v.id) DESC
    """)
    Page<TopViolatorResponse> findTopViolatorsByTargetType(@Param("targetType") TargetType targetType, Pageable pageable);
}
