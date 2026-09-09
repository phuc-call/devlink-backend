package com.devlink.chat_service.dto.reponse;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class MessageDeletedForMeResponse {
    private String action;
    private Long conversationId;
    private Long messageId;
    private List<Long> mediaIds;
}
