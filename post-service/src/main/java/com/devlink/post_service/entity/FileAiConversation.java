package com.devlink.post_service.entity;

import com.devlink.post_service.entity.enums.AiConversationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;


// FileAiConversation.java
@Entity
@Table(name = "file_ai_conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileAiConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "post_file_id", nullable = false)
    private Long postFileId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private AiConversationStatus status = AiConversationStatus.PENDING;

    @Column(name = "model_used", length = 50)
    private String modelUsed;

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = Instant.now(); }
}