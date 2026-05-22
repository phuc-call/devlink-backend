package com.devlink.post_service.entity;

import com.devlink.post_service.entity.enums.SaveType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "save_type", length = 20, nullable = false)
    private SaveType saveType = SaveType.MANUAL;

    @Column(name = "saved_at", nullable = false, updatable = false)
    private LocalDateTime savedAt;

    @PrePersist
    protected void onCreate() { this.savedAt = LocalDateTime.now(); }
}