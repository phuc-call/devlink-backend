package com.devlink.post_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserProfile {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "language", length = 50)
    private String language;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
