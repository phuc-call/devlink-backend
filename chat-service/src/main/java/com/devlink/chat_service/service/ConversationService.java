package com.devlink.chat_service.service;

import com.devlink.chat_service.dto.reponse.ConversationResponse;
import com.devlink.chat_service.dto.reponse.MediaFileResponse;
import com.devlink.chat_service.dto.request.MediaFilterRequest;
import com.devlink.chat_service.entity.enums.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Slice;

import java.time.LocalDateTime;
import java.util.List;

public interface ConversationService {
    Page<MediaFileResponse> getConversationMedia(Long conversationId, MediaFilterRequest filter);
    void createDirectConversationAuto(Long user1Id, Long user2Id);
    void createGroupConversationAuto(Long groupId, String groupName, String avatarUrl, List<Long> memberIds);
    Slice<ConversationResponse> getConversations(int page, int size);
    ConversationResponse getOrCreateDirectConversation(Long receiverId);
    void markConversationAsRead(Long conversationId);
    void pinConversation(Long conversationId);
}
