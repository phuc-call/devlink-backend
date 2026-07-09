package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.AskAIRequest;
import com.devlink.post_service.dto.response.AskAIResponse;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.service.AIAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateAIController {

    private final AIAssistantService aiAssistantService;

    @PostMapping("/{templateId}/ask")
    public ResponseEntity<ApiResponse<AskAIResponse>> askAboutTemplate(
            @PathVariable Long templateId,
            @RequestBody @Valid AskAIRequest request
    ) {
        AskAIResponse response = aiAssistantService.askAboutTemplate(templateId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Success"));
    }
}
