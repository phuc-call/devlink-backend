package com.devlink.post_service.repository;

import com.devlink.post_service.entity.Report;
import com.devlink.post_service.entity.enums.ReportReason;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    @Query("""
            SELECT r FROM Report r
            WHERE r.reporterId = :reporterId
              AND r.targetId   = :targetId
              AND r.targetType = :targetType
            """)
    Optional<Report> findExisting(
            @Param("reporterId") Long reporterId,
            @Param("targetId") Long targetId,
            @Param("targetType") TargetType targetType
    );

    @Modifying
    @Query("""
            UPDATE Report r
            SET r.reason = :reason,
                r.description = :description,
                r.status = :status,
                r.aiReviewResult = NULL,
                r.aiReviewedAt   = NULL
            WHERE r.id = :id
            """)
    void updateReport(
            @Param("id") Long id,
            @Param("reason") ReportReason reason,
            @Param("description") String description,
            @Param("status") ReportStatus status
    );



}
