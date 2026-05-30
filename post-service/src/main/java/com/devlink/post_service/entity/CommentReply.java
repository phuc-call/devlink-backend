package com.devlink.post_service.entity;

import com.devlink.post_service.entity.enums.AiModerationStatus;
import com.devlink.post_service.entity.enums.CommentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(
        name = "comment_replies",
        indexes = {
                @Index(name = "idx_reply_post",    columnList = "post_id"),
                @Index(name = "idx_reply_comment", columnList = "comment_id"),
                @Index(name = "idx_reply_parent",  columnList = "parent_reply_id"),
                @Index(name = "idx_reply_author",  columnList = "author_id"),
                @Index(name = "idx_reply_created", columnList = "created_at"),
        }
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "comment_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_reply_comment")
    )
    private Comment comment;

    //CommentReply tự trỏ về chính nó vì một reply có thể có cha là một reply khác trong cùng bảng:
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "parent_reply_id",
            nullable = true,
            foreignKey = @ForeignKey(name = "fk_reply_parent")
    )
    private CommentReply parentReply;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    @Column(name = "mentioned_name", length = 100, nullable = false)
    private String mentionedName; //UserName of the user being replied to, fetched by authorId in comment table
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private CommentStatus status = CommentStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_moderation_status", length = 20, nullable = false)
    @Builder.Default
    private AiModerationStatus aiModerationStatus = AiModerationStatus.PENDING;

    @Column(name = "ai_moderation_score")
    private Double aiModerationScore;

    @Column(name = "like_count", nullable = false)
    @Builder.Default
    private Long likeCount = 0L;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}