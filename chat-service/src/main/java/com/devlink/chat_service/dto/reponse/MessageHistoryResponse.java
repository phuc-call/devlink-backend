package com.devlink.chat_service.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageHistoryResponse {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private boolean isRecalled;
    private LocalDateTime recalledAt;
    private LocalDateTime createdAt;

    @Builder.Default
    private List<MediaResponse> mediaList = new ArrayList<>();

    @Builder.Default
    private List<AttachmentResponse> attachmentList = new ArrayList<>();

    // Constructor dùng trực tiếp trong JPQL SELECT
    public MessageHistoryResponse(
            Long id,
            Long conversationId,
            Long senderId,
            String senderName,
            String senderAvatar,
            String content,
            boolean isRecalled,
            LocalDateTime recalledAt,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderAvatar = senderAvatar;
        this.content = content;
        this.isRecalled = isRecalled;
        this.recalledAt = recalledAt;
        this.createdAt = createdAt;
        this.mediaList = new ArrayList<>();
        this.attachmentList = new ArrayList<>();
    }
}