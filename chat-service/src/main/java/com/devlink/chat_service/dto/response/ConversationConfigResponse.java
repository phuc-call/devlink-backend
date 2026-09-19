package com.devlink.chat_service.dto.response; // Typo in original package name "reponse", wait let me check the package name

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationConfigResponse {
    private Long conversationId;
    private String backgroundImageUrl;
    private String themeColor;
}
