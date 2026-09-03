package com.devlink.chat_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateConversationRequest {

    @NotNull(message = "receiverId is required")
    private Long receiverId;
}
