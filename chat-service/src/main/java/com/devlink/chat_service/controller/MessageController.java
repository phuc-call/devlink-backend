package com.devlink.chat_service.controller;

import com.devlink.chat_service.dto.reponse.ApiResponse;
import com.devlink.chat_service.dto.reponse.MessageResponse;
import com.devlink.chat_service.dto.request.SendMessageRequest;
import com.devlink.chat_service.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @Valid @RequestBody SendMessageRequest request
    ) {
        MessageResponse response = messageService.sendMessage(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Message sent"));
    }
}
