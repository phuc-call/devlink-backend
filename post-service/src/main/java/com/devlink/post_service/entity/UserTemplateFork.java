package com.devlink.post_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_template_forks",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_fork",
                columnNames = {"user_id", "template_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTemplateFork {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(length = 255, nullable = false)
    private String title;


    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "file_url", length = 500)
    private String fileUrl;
    @Column(name = "is_proposed", nullable = false)
    private Boolean isProposed = false;

    @Column(name = "proposed_at")
    private Instant proposedAt;
    @Column(name = "is_modified", nullable = false)
    private Boolean isModified = false;

    @Column(name = "last_edited_at")
    private LocalDateTime lastEditedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}