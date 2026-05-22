package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.ModerationResult;

public interface GeminiModerationService {
    ModerationResult moderateContent(String content);

    String summarizeFileContent(String extractedText);
}
