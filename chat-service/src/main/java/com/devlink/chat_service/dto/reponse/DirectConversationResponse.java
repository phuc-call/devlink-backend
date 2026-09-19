package com.devlink.chat_service.dto.reponse;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class DirectConversationResponse extends ConversationResponse {
    private Long otherUserId;
    private String otherUserName;
    private String otherUserAvatar;
}