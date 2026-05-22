package com.devlink.post_service.entity;

import com.devlink.post_service.entity.enums.SuggestionStatus;
import com.devlink.post_service.entity.enums.SuggestionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "template_suggestions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TemplateSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "suggestion_type", length = 20, nullable = false)
    private SuggestionType suggestionType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "suggested_code", columnDefinition = "LONGTEXT")
    private String suggestedCode;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private SuggestionStatus status = SuggestionStatus.PENDING;

    @Column(name = "admin_note", length = 500)
    private String adminNote;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}