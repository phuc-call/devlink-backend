package com.devlink.chat_service.controller;

import com.devlink.chat_service.dto.reponse.ApiResponse;
import com.devlink.chat_service.dto.reponse.ConversationResponse;
import com.devlink.chat_service.dto.request.CreateConversationRequest;
import com.devlink.chat_service.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Page;
import com.devlink.chat_service.dto.reponse.MediaFileResponse;
import com.devlink.chat_service.dto.request.MediaFilterRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Slice<ConversationResponse>>> getConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Slice<ConversationResponse> slice = conversationService.getConversations(page, size);
        return ResponseEntity.ok(ApiResponse.ok(slice));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> createOrGetDirectConversation(
            @RequestBody CreateConversationRequest request
    ) {
        ConversationResponse response = conversationService.getOrCreateDirectConversation(request.getReceiverId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{conversationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long conversationId) {
        conversationService.markConversationAsRead(conversationId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PutMapping("/{conversationId}/pin")
    public ResponseEntity<ApiResponse<Void>> pinConversation(@PathVariable Long conversationId) {
        conversationService.pinConversation(conversationId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/{conversationId}/media")
    public ResponseEntity<ApiResponse<Page<MediaFileResponse>>> getConversationMedia(
            @PathVariable Long conversationId,
            @ModelAttribute MediaFilterRequest filter
    ) {
        Page<MediaFileResponse> result = conversationService.getConversationMedia(conversationId, filter);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}