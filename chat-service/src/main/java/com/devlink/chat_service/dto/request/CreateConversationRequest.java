package com.devlink.chat_service.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateConversationRequest {
    private Long receiverId;
}