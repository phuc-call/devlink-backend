package com.devlink.post_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "comment_locks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentLock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // NULL = khóa toàn service
    @Column(name = "post_id")
    private Long postId;

    @Column(length = 500, nullable = false)
    private String reason;

    @Column(name = "locked_by", length = 50, nullable = false)
    private String lockedBy;

    @Column(name = "lock_duration_days", nullable = false)
    private Integer lockDurationDays;

    @Column(name = "locked_until", nullable = false)
    private Instant lockedUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = Instant.now(); }
}