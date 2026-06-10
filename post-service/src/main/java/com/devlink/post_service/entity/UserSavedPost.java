package com.devlink.post_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;


@Entity
@Table(name = "user_saved_posts",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_saved",
                columnNames = {"user_id", "post_id"}
        )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSavedPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "post_id", nullable = false)
    private Long postId;


    @Column(name = "saved_at", nullable = false, updatable = false)
    private Instant savedAt;

    @PrePersist
    protected void onCreate() { this.savedAt = Instant.now(); }
}