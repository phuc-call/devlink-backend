package com.devlink.chat_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversation_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false, unique = true)
    private Conversation conversation;

    @Column(name = "background_image_url", length = 500)
    private String backgroundImageUrl;

    @Column(name = "theme_color", length = 20)
    @Builder.Default
    private String themeColor = "#0084ff";

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pinned_message_id")
    private Message pinnedMessage;

    @Column(name = "only_read", nullable = false)
    @Builder.Default
    private Boolean onlyRead = false;

    @Column(name = "allow_send_media", nullable = false)
    @Builder.Default
    private Boolean allowSendMedia = true;

    @Column(name = "allow_send_links", nullable = false)
    @Builder.Default
    private Boolean allowSendLinks = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
