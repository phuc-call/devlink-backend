package com.devlink.chat_service.controller;

import com.devlink.chat_service.dto.reponse.ApiResponse;
import com.devlink.chat_service.dto.reponse.ConversationMessagesResponse;
import com.devlink.chat_service.dto.reponse.MessageHistoryResponse;
import com.devlink.chat_service.dto.reponse.MessageResponse;
import com.devlink.chat_service.dto.request.SendMessageRequest;
import com.devlink.chat_service.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @Valid @ModelAttribute SendMessageRequest request
    ) {
        MessageResponse response = messageService.sendMessage(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Message sent"));
    }
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<ConversationMessagesResponse>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit
    ) {
        ConversationMessagesResponse response = messageService.getMessagesByConversation(conversationId, cursor, limit);
        return ResponseEntity.ok(ApiResponse.ok(response, "Get messages successfully"));
    }
    @PutMapping("/{messageId}/recall")
    public ResponseEntity<ApiResponse<Void>> recallMessage(@PathVariable Long messageId) {
        messageService.recallMessage(messageId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Message recalled successfully"));
    }
    @DeleteMapping("/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable Long messageId) {
        messageService.deleteMessage(messageId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Message deleted for you"));
    }

    @DeleteMapping("/conversations/{conversationId}/media")
    public ResponseEntity<ApiResponse<Void>> deleteMediaForMe(
            @PathVariable Long conversationId,
            @RequestBody List<Long> mediaIds
    ) {
        messageService.deleteMediaForMe(conversationId, mediaIds);
        return ResponseEntity.ok(ApiResponse.ok(null, "Media deleted for you"));
    }

    @GetMapping("/conversations/{conversationId}/search")
    public ResponseEntity<ApiResponse<List<MessageHistoryResponse>>> searchMessages(
            @PathVariable Long conversationId,
            @RequestParam String keyword
    ) {
        List<MessageHistoryResponse> response = messageService.searchMessages(conversationId, keyword);
        return ResponseEntity.ok(ApiResponse.ok(response, "Search messages successfully"));
    }
}
