package com.devlink.post_service.entity;

import com.devlink.post_service.entity.enums.ActionType;
import com.devlink.post_service.entity.enums.TargetType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "user_interactions",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_ui_interaction",
                columnNames = {"user_id", "target_id", "target_type", "action"}
        ),
        indexes = {
                @Index(name = "idx_ui_target",      columnList = "target_id, target_type, action"),
                @Index(name = "idx_ui_user_action", columnList = "user_id, action"),
                @Index(name = "idx_ui_created",     columnList = "created_at")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 30)
    private TargetType targetType;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private ActionType action;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = Instant.now(); }
}