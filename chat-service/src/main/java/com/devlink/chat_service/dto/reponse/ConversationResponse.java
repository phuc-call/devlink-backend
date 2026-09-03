package com.devlink.chat_service.dto.reponse;

import com.devlink.chat_service.entity.enums.ConversationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ConversationResponse {

    private Long id;
    private ConversationType type;
    private Long otherUserId;       // ID người còn lại trong cuộc trò chuyện (1-1)
    private String otherUserName;   // Tên hiển thị
    private String otherUserAvatar; // Avatar URL
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
