package com.devlink.post_service.entity;

import com.devlink.post_service.entity.enums.Difficulty;
import com.devlink.post_service.entity.enums.TemplateFileType;
import com.devlink.post_service.entity.enums.TemplateStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "learning_templates")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LearningTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255, nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50, nullable = false)
    private String language;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Difficulty difficulty = Difficulty.BEGINNER;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", length = 20, nullable = false)
    private TemplateFileType fileType;

    @Column(name = "file_url", length = 500, nullable = false)
    private String fileUrl;

    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    // Source code gốc — chỉ dùng khi fileType = CODE
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    // Text trích xuất từ PDF/DOCX cho AI context
    @Column(name = "extracted_text", columnDefinition = "LONGTEXT")
    private String extractedText;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    // JSON string: ["spring-boot","oop","design-pattern"]
    @Column(columnDefinition = "JSON")
    private String tags;

    // JSON string: ["backend","database","api"]
    @Column(columnDefinition = "JSON")
    private String topics;

    @Builder.Default
    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L;

    @Builder.Default
    @Column(name = "fork_count", nullable = false)
    private Long forkCount = 0L;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private TemplateStatus status = TemplateStatus.ACTIVE;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}