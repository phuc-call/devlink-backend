package com.devlink.chat_service.controller;

import com.devlink.chat_service.dto.reponse.ApiResponse;
import com.devlink.chat_service.dto.reponse.PinMessageResponse;
import com.devlink.chat_service.service.PinnedMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat/pinned-messages")
@RequiredArgsConstructor
public class PinnedMessageController {

    private final PinnedMessageService pinnedMessageService;

    @PostMapping("/{messageId}")
    public ResponseEntity<ApiResponse<Void>> pinMessage(@PathVariable Long messageId) {
        pinnedMessageService.pinMessage(messageId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/{pinnedMessageId}")
    public ResponseEntity<ApiResponse<Void>> unpinMessage(@PathVariable Long pinnedMessageId) {
        pinnedMessageService.unpinMessage(pinnedMessageId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<ApiResponse<java.util.List<PinMessageResponse>>> getPinMessages(@PathVariable Long conversationId) {
        java.util.List<PinMessageResponse> response = pinnedMessageService.getPinMessages(conversationId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
