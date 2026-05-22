package com.devlink.post_service.entity;
import com.devlink.post_service.entity.enums.AiConversationStatus;
import jakarta.persistence.*;
import lombok.*;


import java.time.LocalDateTime;

@Entity
@Table(name = "template_ai_conversations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TemplateAiConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    // NULL = đang hỏi từ template gốc, không phải fork
    @Column(name = "fork_id")
    private Long forkId;

    @Column(name = "context_code", columnDefinition = "TEXT")
    private String contextCode;

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
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}