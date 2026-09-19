package com.devlink.chat_service.entity;

import com.devlink.chat_service.entity.enums.MessageType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "messages",
        indexes = {
                @Index(name = "idx_msg_conv_id", columnList = "conversation_id"),
                @Index(name = "idx_msg_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MessageType type =MessageType.TEXT;

    @Column(name = "is_recalled", nullable = false)
    @Builder.Default
    private boolean isRecalled = false;

    @Column(name = "recalled_at")
    private LocalDateTime recalledAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
