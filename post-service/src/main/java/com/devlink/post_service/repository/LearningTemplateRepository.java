package com.devlink.post_service.repository;

import com.devlink.post_service.dto.response.TemplateCardResponse;
import com.devlink.post_service.dto.response.TemplateOverviewItemResponse;
import com.devlink.post_service.dto.response.TemplateStatsProjectionResponse;
import com.devlink.post_service.entity.LearningTemplate;
import com.devlink.post_service.entity.enums.Difficulty;
import com.devlink.post_service.entity.enums.TemplateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface LearningTemplateRepository extends JpaRepository<LearningTemplate, Long> {

    @Modifying
    @Query("UPDATE LearningTemplate t SET t.extractedText = :extractedText, t.aiSummary = :aiSummary WHERE t.id = :id")
    void updateExtractedTextAndSummary(
            @Param("id") Long id,
            @Param("extractedText") String extractedText,
            @Param("aiSummary") String aiSummary
    );

    @Query("""
            SELECT new com.devlink.post_service.dto.response.TemplateCardResponse(
                t.id, t.title, t.language, t.difficulty, t.fileType,
                t.fileUrl, t.fileName, t.aiSummary, t.viewCount, t.forkCount,
                t.status, t.createdAt,
                CASE WHEN EXISTS (
                    SELECT 1 FROM UserTemplateFork f
                    WHERE f.templateId = t.id AND f.userId = :userId
                ) THEN true ELSE false END
            )
            FROM LearningTemplate t
            WHERE t.status IN :statuses
            AND (t.language IN :languages)
            AND (:difficulty IS NULL OR t.difficulty = :difficulty)
            AND (:tag IS NULL OR t.tags LIKE %:tag%)
            ORDER BY t.difficulty ASC, t.createdAt DESC
            """)
    Page<TemplateCardResponse> findTemplates(
            @Param("userId") Long userId,
            @Param("statuses") List<TemplateStatus> statuses,
            @Param("languages") List<String> languages,
            @Param("difficulty") Difficulty difficulty,
            @Param("tag") String tag,
            Pageable pageable);

    @Query("""
            SELECT new com.devlink.post_service.dto.response.TemplateCardResponse(
                t.id, t.title, t.language, t.difficulty, t.fileType,
                t.fileUrl, t.fileName, t.aiSummary, t.viewCount, t.forkCount,
                t.status, t.createdAt, false
            )
            FROM LearningTemplate t
            WHERE t.status IN :statuses
            AND (t.language IN :languages)
            AND (:difficulty IS NULL OR t.difficulty = :difficulty)
            AND (:tag IS NULL OR t.tags LIKE %:tag%)
            ORDER BY t.difficulty ASC, t.createdAt DESC
            """)
    Page<TemplateCardResponse> getTemplatesForAdmin(
            @Param("statuses") List<TemplateStatus> statuses,
            @Param("languages") List<String> languages,
            @Param("difficulty") Difficulty difficulty,
            @Param("tag") String tag,
            Pageable pageable);


    Optional<LearningTemplate> findByIdAndStatus(Long id, TemplateStatus status);

    @Modifying
    @Query("UPDATE LearningTemplate lt SET lt.forkCount = lt.forkCount + 1 WHERE lt.id = :id")
    void incrementForkCount(@Param("id") Long id);



    @Query("""
    SELECT new com.devlink.post_service.dto.response.TemplateOverviewItemResponse(
        t.id, t.title, t.language, t.difficulty, t.fileType, t.status,
        t.viewCount, t.forkCount, t.createdAt
    )
    FROM LearningTemplate t
    WHERE t.createdAt BETWEEN :start AND :end
""")
    List<TemplateOverviewItemResponse> findOverviewItemsBetween(
            @Param("start") Instant start,
            @Param("end") Instant end
    );


    @Query("""
    SELECT new com.devlink.post_service.dto.response.TemplateStatsProjectionResponse(
        t.status, t.language, t.fileType, t.difficulty,
        COUNT(t.id), SUM(t.viewCount)
    )
    FROM LearningTemplate t
    WHERE t.createdAt BETWEEN :start AND :end
    GROUP BY t.status, t.language, t.fileType, t.difficulty
""")
    List<TemplateStatsProjectionResponse> findStatsBetween(
            @Param("start") Instant start,
            @Param("end") Instant end
    );



}
