package com.devlink.chat_service.dto.reponse;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MessageResponse {

    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private com.devlink.chat_service.entity.enums.MessageType type;
    private String clientTempId;
    private LocalDateTime createdAt;
}
