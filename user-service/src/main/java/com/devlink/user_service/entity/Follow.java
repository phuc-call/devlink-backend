package com.devlink.user_service.entity;

import com.devlink.user_service.entity.enums.FollowStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "follows",
        uniqueConstraints = @UniqueConstraint(columnNames = {"follower_id", "following_id"}),
        indexes = {
                @Index(name = "idx_follow_follower", columnList = "follower_id"),
                @Index(name = "idx_follow_following", columnList = "following_id")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class Follow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id",nullable = false)
    private User following;

    // PENDING (chờ duyệt, F017–F018) | ACCEPTED
    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private FollowStatus status = FollowStatus.ACCEPTED;
    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;
    @Column(name = "last_interacted_at")
    private LocalDateTime lastInteractedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
