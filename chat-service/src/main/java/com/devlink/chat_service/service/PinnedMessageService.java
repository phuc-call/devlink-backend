package com.devlink.chat_service.service;

import com.devlink.chat_service.dto.reponse.PinMessageResponse;
import java.util.List;

public interface PinnedMessageService {
    PinMessageResponse pinMessage(Long messageId);
    void unpinMessage(Long messageId);
    List<PinMessageResponse> getPinMessages(Long conversationId);
}
