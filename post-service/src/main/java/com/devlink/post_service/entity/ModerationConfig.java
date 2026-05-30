package com.devlink.post_service.entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "moderation_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModerationConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ai_enabled", nullable = false)
    private Boolean aiEnabled = true;

    @Column(name = "auto_lock_comment_days", nullable = false)
    private Integer autoLockCommentDays = 7;

    @Column(name = "auto_lock_threshold", nullable = false)
    private Integer autoLockThreshold = 3;

    @Column(name = "report_auto_review_enabled", nullable = false)
    private Boolean reportAutoReviewEnabled = true;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() { this.updatedAt = Instant.now(); }
}