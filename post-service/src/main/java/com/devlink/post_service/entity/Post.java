package com.devlink.post_service.entity;

import com.devlink.post_service.entity.enums.AiModerationStatus;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.entity.enums.Visibility;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(columnDefinition = "TEXT")
    private String content;
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private PostStatus status = PostStatus.PENDING_REVIEW;
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Visibility visibility = Visibility.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", length = 20, nullable = false)
    private PostType postType = PostType.TEXT;

    @Column(name = "shared_post_id")
    private Long sharedPostId;

    @Builder.Default
    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L;
    @Builder.Default
    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_moderation_status", length = 20, nullable = false)
    private AiModerationStatus aiModerationStatus = AiModerationStatus.PENDING;

    @Column(name = "ai_moderation_score")
    private Double aiModerationScore;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL,
            orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PostTag> tags = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL,
            orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PostMedia> mediaList = new ArrayList<>();

    @Column(name = "ai_moderation_reason", length = 500)
    private String aiModerationReason;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate ///todo: sao này tìm hiểu thêm
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}