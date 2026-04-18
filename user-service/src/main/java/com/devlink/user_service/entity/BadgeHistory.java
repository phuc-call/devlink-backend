package com.devlink.user_service.entity;

import com.devlink.user_service.entity.enums.BadgeType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(name = "badge_history", indexes = {
        @Index(name = "idx_badge_user", columnList = "user_id"),
        @Index(name="idx_badge_history_created", columnList = "created_at")
})
public class BadgeHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "badge_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private BadgeType badgeType;
    @Column(name = "granted_by", nullable = false, length = 100)
    private String grantedBy;
    @Column(name = "reason", length = 500)
    private String reason;
    @Column(name = "follower_count_snapshot")
    private Long followerCountSnapshot;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
