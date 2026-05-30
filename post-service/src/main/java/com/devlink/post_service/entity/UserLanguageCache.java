package com.devlink.post_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

///TODO: not user in the feturn
@Entity
@Table(name = "user_language_cache")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLanguageCache {

    @Id
    @Column(name = "user_id")
    private Long userId;

    // JSON string: ["java","react","nodejs"]
    @Column(columnDefinition = "JSON", nullable = false)
    private String languages;

    @Column(name = "cached_at", nullable = false)
    private LocalDateTime cachedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() { this.cachedAt = LocalDateTime.now(); }
}