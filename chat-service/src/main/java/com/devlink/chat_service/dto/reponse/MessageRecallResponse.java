package com.devlink.chat_service.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRecallResponse {
    private String action;
    private Long messageId;
    private Long conversationId;
}
