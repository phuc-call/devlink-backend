package com.devlink.chat_service.dto.reponse;

import com.devlink.chat_service.entity.enums.ConversationType;
import com.devlink.chat_service.entity.enums.MessageType;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Getter
@SuperBuilder
public abstract class ConversationResponse {
    
    private Long id;
    private ConversationType type;

    private Long lastMessageId;
    private String lastMessageContent;
    private MessageType lastMessageType;
    private String lastMessageSenderName;
    private Boolean isLastMessageRecalled;
    private LocalDateTime lastMessageAt;

    private Long countUnreadMessages;
    private Boolean isMuted;
    private Boolean isPinned;
    private LocalDateTime pinnedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}