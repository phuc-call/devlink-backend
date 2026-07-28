package com.devlink.post_service.repository;

import com.devlink.post_service.entity.ViolationHistory;
import com.devlink.post_service.entity.enums.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
}
