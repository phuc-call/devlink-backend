package com.devlink.chat_service.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationMessagesResponse {
    private Long conversationId;
    private String type; // DIRECT hoặc GROUP
    private String title;
    private String avatarUrl;

    // Dành riêng cho 1v1 DIRECT
    private Long partnerId;
    private boolean isBlocked;

    // Danh sách tin nhắn & Cursor phân trang
    private List<MessageHistoryResponse> messages;
    private Long nextCursor;
    private boolean hasMore;
}