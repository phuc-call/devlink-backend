package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.AskAIRequest;
import com.devlink.post_service.dto.response.AskAIResponse;

public interface AIAssistantService {

    AskAIResponse askAboutTemplate(Long templateId, AskAIRequest request);
}
