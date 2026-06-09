package com.devlink.post_service.repository;

import com.devlink.post_service.dto.response.SuggestionDetailResponse;
import com.devlink.post_service.dto.response.SuggestionSummary;
import com.devlink.post_service.entity.TemplateSuggestion;
import com.devlink.post_service.entity.enums.SuggestionStatus;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TemplateSuggestionRepository extends JpaRepository<TemplateSuggestion, Long> {
    Optional<TemplateSuggestion> findByUserIdAndTemplateIdAndStatus(
            Long userId, Long templateId, SuggestionStatus status
    );

    @Query("""
                SELECT new com.devlink.post_service.dto.response.SuggestionSummary(
                    s.id, f.id, s.userId, s.templateId, s.status, s.createdAt
                )
                FROM TemplateSuggestion s
                JOIN UserTemplateFork f ON f.userId = s.userId AND f.templateId = s.templateId
                WHERE f.isProposed = true
                AND s.status IN ('PENDING', 'REVIEWING')
                ORDER BY
                    CASE s.status WHEN 'PENDING' THEN 0 WHEN 'REVIEWING' THEN 1 ELSE 2 END ASC,
                    s.createdAt ASC
            """)
    Page<SuggestionSummary> findAllPendingForAdmin(Pageable pageable);

    @Query("""
                SELECT
                    s.id AS id,
                    s.templateId AS templateId,
                    s.userId AS userId,
                    s.suggestionType AS suggestionType,
                    s.description AS description,
            
                    s.status AS status,
                    s.createdAt AS createdAt,
                    f.id AS forkId,
                    f.title AS forkTitle,
                    f.content AS forkContent,
                    f.fileUrl AS forkFileUrl,
                    f.lastEditedAt AS forkLastEditedAt
                FROM TemplateSuggestion s
                JOIN UserTemplateFork f ON f.userId = s.userId AND f.templateId = s.templateId
                WHERE s.id = :suggestionId
            """)
    Optional<SuggestionDetailResponse> findDetailById(@Param("suggestionId") Long suggestionId);

    @Query("""
                SELECT new com.devlink.post_service.dto.response.SuggestionSummary(
                    s.id, f.id, s.userId, s.templateId, s.status, s.createdAt
                )
                FROM TemplateSuggestion s
                LEFT JOIN UserTemplateFork f ON f.userId = s.userId AND f.templateId = s.templateId
                ORDER BY s.status ASC, s.createdAt ASC
            """)
    List<SuggestionSummary> findAllGroupedByStatus();

    @Query("""
                SELECT new com.devlink.post_service.dto.response.SuggestionSummary(
                    s.id, f.id, s.userId, s.templateId, s.status, s.createdAt
                )
                FROM TemplateSuggestion s
                LEFT JOIN UserTemplateFork f ON f.userId = s.userId AND f.templateId = s.templateId
                WHERE s.status = :status
                ORDER BY s.createdAt ASC
            """)
    Page<SuggestionSummary> findByStatus(@Param("status") SuggestionStatus status, Pageable pageable);

    @Query("""
                SELECT s.suggestionType AS suggestionType,
                       CAST(s.createdAt AS date) AS date,
                       COUNT(s.id) AS total
                FROM TemplateSuggestion s
                WHERE s.createdAt >= :from AND s.createdAt < :to
                GROUP BY s.suggestionType, CAST(s.createdAt AS date)
                ORDER BY CAST(s.createdAt AS date) ASC
            """)
    List<Object[]> findCountByTypeAndDateBetween(
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
    SELECT s.id FROM TemplateSuggestion s
    WHERE s.userId = :userId
    AND s.templateId = :templateId
    AND s.status IN ('PENDING', 'REVIEWING')
""")
    Optional<Long> findActiveSuggestionId(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("templateId") Long templateId
    );

}
