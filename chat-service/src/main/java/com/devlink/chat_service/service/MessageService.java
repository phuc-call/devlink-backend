package com.devlink.chat_service.service;

import com.devlink.chat_service.dto.reponse.ConversationMessagesResponse;
import com.devlink.chat_service.dto.reponse.MessageHistoryResponse;
import com.devlink.chat_service.dto.reponse.MessageResponse;
import com.devlink.chat_service.dto.request.SendMessageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MessageService {
    MessageResponse sendMessage(SendMessageRequest request);
    void recallMessage(Long messageId);
    void deleteMessage(Long messageId);
    void deleteMediaForMe(Long conversationId, List<Long> mediaIds);
    ConversationMessagesResponse getMessagesByConversation(Long conversationId, Long cursor, int limit);
    List<MessageHistoryResponse> searchMessages(Long conversationId, String keyword);
}


