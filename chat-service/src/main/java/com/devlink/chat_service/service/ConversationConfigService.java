package com.devlink.chat_service.service;

import com.devlink.chat_service.dto.response.ConversationConfigResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ConversationConfigService {
    ConversationConfigResponse updateConfig(Long conversationId, String themeColor, MultipartFile backgroundFile,
            Long userId);

    ConversationConfigResponse getConfig(Long conversationId, Long userId);
}
