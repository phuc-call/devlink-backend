package com.devlink.post_service.entity;

import com.devlink.post_service.entity.enums.MediaType;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// PostMedia.java
@Entity
@Table(name = "post_media")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PostMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", length = 10, nullable = false)
    private MediaType mediaType;

    @Column(length = 500, nullable = false)
    private String url;

    // Chỉ dùng cho IMAGE | VIDEO
    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "original_name", length = 255)
    private String originalName;

    @Column(name = "file_extension", length = 20)
    private String fileExtension;



    // Chỉ dùng cho VIDEO
    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}