package com.devlink.chat_service.service;

import com.devlink.chat_service.dto.reponse.ConversationResponse;
import com.devlink.chat_service.dto.request.CreateConversationRequest;

public interface ConversationService {

    ConversationResponse createDirectConversation(CreateConversationRequest request);
}
