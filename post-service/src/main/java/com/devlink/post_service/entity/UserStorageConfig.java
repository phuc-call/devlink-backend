package com.devlink.post_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_storage_config")
@Getter
@Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserStorageConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "auto_save_enabled", nullable = false)
    private Boolean autoSaveEnabled = false;

    // JSON string: ["java","spring","ai"]
    @Column(name = "match_topics", columnDefinition = "JSON")
    private String matchTopics;

    // JSON string: ["backend","devops"]
    @Column(name = "match_interests", columnDefinition = "JSON")
    private String matchInterests;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() { this.updatedAt = LocalDateTime.now(); }
}