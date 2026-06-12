package com.devlink.post_service.repository;

import com.devlink.post_service.dto.procedure.ReportItemProjection;
import com.devlink.post_service.entity.Report;
import com.devlink.post_service.entity.enums.ReportReason;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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
    /**
     * Cursor-based pagination — load 20 reports follow targetType.
     * cursor = null -> load từ đầu, cursor != null -> load tiếp từ sau cursor.
     */
    @Query("""
            SELECT r FROM Report r
            WHERE r.targetType = :targetType
              AND (:cursor IS NULL OR r.id < :cursor)
            ORDER BY r.id DESC
            """)
    List<Report> findByTargetTypeCursor(
            @Param("targetType") TargetType targetType,
            @Param("cursor") Long cursor,
            org.springframework.data.domain.Pageable pageable
    );

    @Query("""
        SELECT r.id        AS reportId,
               r.targetId  AS targetId,
               r.targetType AS targetType,
               p.authorId  AS violatorUserId,
               r.reporterId AS reporterId,
               r.reason    AS reason,
               r.description AS description,
               r.status    AS status,
               r.createdAt AS createdAt
        FROM Report r
        JOIN Post p ON p.id = r.targetId
        WHERE r.targetType = 'POST'
          AND (:status IS NULL OR r.status = :status)
        ORDER BY r.createdAt DESC
        """)
    Page<ReportItemProjection> findPostReports(
            @Param("status") ReportStatus status,
            Pageable pageable
    );

    @Query("""
        SELECT r.id        AS reportId,
               r.targetId  AS targetId,
               r.targetType AS targetType,
               c.authorId  AS violatorUserId,
               r.reporterId AS reporterId,
               r.reason    AS reason,
               r.description AS description,
               r.status    AS status,
               r.createdAt AS createdAt
        FROM Report r
        JOIN Comment c ON c.id = r.targetId
        WHERE r.targetType = 'COMMENT'
          AND (:status IS NULL OR r.status = :status)
        ORDER BY r.createdAt DESC
        """)
    Page<ReportItemProjection> findCommentReports(
            @Param("status") ReportStatus status,
            Pageable pageable
    );

    @Query("""
        SELECT r.id        AS reportId,
               r.targetId  AS targetId,
               r.targetType AS targetType,
               cr.authorId AS violatorUserId,
               r.reporterId AS reporterId,
               r.reason    AS reason,
               r.description AS description,
               r.status    AS status,
               r.createdAt AS createdAt
        FROM Report r
        JOIN CommentReply cr ON cr.id = r.targetId
        WHERE r.targetType = 'COMMENT_REPLY'
          AND (:status IS NULL OR r.status = :status)
        ORDER BY r.createdAt DESC
        """)
    Page<ReportItemProjection> findCommentReplyReports(
            @Param("status") ReportStatus status,
            Pageable pageable
    );
    @Query("""
    SELECT r FROM Report r
    WHERE r.restrictionId = :restrictionId
    """)
    Optional<Report> findByRestrictionId(@Param("restrictionId") Long restrictionId);

}
