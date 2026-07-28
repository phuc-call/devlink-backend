package com.devlink.post_service.entity;

import com.devlink.post_service.entity.enums.TargetType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "violation_histories", indexes = {
        @Index(name = "idx_vh_violator", columnList = "violator_id"),
        @Index(name = "idx_vh_report",   columnList = "report_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ViolationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_id", nullable = false)
    private Long reportId;

    @Column(name = "violator_id", nullable = false)
    private Long violatorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", length = 20, nullable = false)
    private TargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "reason", length = 30, nullable = false)
    private String reason;

    @Column(name = "violation_at", nullable = false)
    private Instant violationAt;

    @Column(name = "penalty_start_at", nullable = false)
    private Instant penaltyStartAt;

    @Column(name = "penalty_end_at")
    private Instant penaltyEndAt;

    @Column(name = "violation_count", nullable = false)
    private Integer violationCount;

    @Column(name = "restriction_id")
    private Long restrictionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
