package com.devlink.post_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "violation_penalty_configs",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_penalty",
                columnNames = {"target_type", "reason", "offense_number"}
        )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ViolationPenaltyConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "target_type", length = 20, nullable = false)
    private String targetType;

    @Column(name = "reason", length = 30, nullable = false)
    @Builder.Default
    private String reason = "ALL";

    @Column(name = "offense_number", nullable = false)
    private Integer offenseNumber;

    @Column(name = "penalty_days", nullable = false)
    private Integer penaltyDays;

    @Column(name = "is_permanent", nullable = false)
    @Builder.Default
    private Boolean permanent = false;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = Instant.now();
    }
}
