package com.devlink.chat_service.controller;

import com.devlink.chat_service.dto.reponse.ApiResponse;
import com.devlink.chat_service.dto.reponse.ConversationResponse;
import com.devlink.chat_service.dto.request.CreateConversationRequest;
import com.devlink.chat_service.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> createOrGetDirectConversation(
            @Valid @RequestBody CreateConversationRequest request
    ) {
        ConversationResponse response = conversationService.createDirectConversation(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Conversation ready"));
    }
}
