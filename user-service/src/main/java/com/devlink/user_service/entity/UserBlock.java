package com.devlink.user_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_blocks",
        uniqueConstraints = @UniqueConstraint(columnNames = {"blocker_id", "blocked_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
 public class UserBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The person who performed the block
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocker_id", nullable = false)
    private User blocker;

    // blocked person
    @Column(name = "blocked_id", nullable = false)
    private Long blockedId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
