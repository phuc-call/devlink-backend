package com.devlink.user_service.service;

import com.devlink.user_service.dto.response.WsEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebSocketEventPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public void publishUserEvent(Long userId, String eventType, Object payload) {
        messagingTemplate.convertAndSend("/topic/user/" + userId, new WsEvent(eventType, payload));
    }
}
