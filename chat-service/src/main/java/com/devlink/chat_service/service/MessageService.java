package com.devlink.chat_service.service;

import com.devlink.chat_service.dto.reponse.MessageResponse;
import com.devlink.chat_service.dto.request.SendMessageRequest;

public interface MessageService {
    MessageResponse sendMessage(SendMessageRequest request);

}
