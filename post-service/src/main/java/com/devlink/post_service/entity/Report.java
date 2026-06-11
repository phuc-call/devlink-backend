package com.devlink.post_service.entity;

import com.devlink.post_service.entity.enums.ReportReason;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_report",
                columnNames = {"reporter_id", "target_id", "target_type"}
        )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", length = 10, nullable = false)
    private TargetType targetType;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private ReportReason reason;

    @Column(length = 500)
    private String description;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @Column(name = "ai_review_result", columnDefinition = "TEXT")
    private String aiReviewResult;

    @Column(name = "ai_reviewed_at")
    private LocalDateTime aiReviewedAt;

    @Column(name = "resolved_by")
    private Long resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_note", length = 500)
    private String reviewNote;

    @Column(name = "restriction_id")
    private Long restrictionId;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}