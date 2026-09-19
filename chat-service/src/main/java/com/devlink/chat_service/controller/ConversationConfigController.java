package com.devlink.chat_service.controller;

import com.devlink.chat_service.dto.response.ConversationConfigResponse; // Wait, wait, actually I created it in response or reponse?
import com.devlink.chat_service.security.SecurityUtils;
import com.devlink.chat_service.service.ConversationConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.devlink.chat_service.dto.reponse.ApiResponse;

@RestController
@RequestMapping("/api/chat/conversations")
@RequiredArgsConstructor
public class ConversationConfigController {

    private final ConversationConfigService conversationConfigService;

    @GetMapping("/{conversationId}/configs")
    public ResponseEntity<ApiResponse<ConversationConfigResponse>> getConfig(@PathVariable Long conversationId) {
        Long userId = SecurityUtils.getCurrentUserId();
        ConversationConfigResponse response = conversationConfigService.getConfig(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{conversationId}/configs")
    public ResponseEntity<ApiResponse<ConversationConfigResponse>> updateConfig(
            @PathVariable Long conversationId,
            @RequestParam(required = false) String themeColor,
            @RequestParam(required = false) MultipartFile backgroundFile) {

        Long userId = SecurityUtils.getCurrentUserId();
        ConversationConfigResponse response = conversationConfigService.updateConfig(conversationId, themeColor,
                backgroundFile, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
