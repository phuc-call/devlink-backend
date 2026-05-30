package com.devlink.post_service.repository;

import com.devlink.post_service.entity.LearningTemplate;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface LearningTemplateRepository extends JpaRepository<LearningTemplate,Long> {

    @Modifying
    @Query("UPDATE LearningTemplate t SET t.extractedText = :extractedText, t.aiSummary = :aiSummary WHERE t.id = :id")
    void updateExtractedTextAndSummary(
            @Param("id") Long id,
            @Param("extractedText") String extractedText,
            @Param("aiSummary") String aiSummary
    );
}
