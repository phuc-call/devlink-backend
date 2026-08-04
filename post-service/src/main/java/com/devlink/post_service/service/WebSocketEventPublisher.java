package com.devlink.post_service.service;

import com.devlink.post_service.dto.response.WsEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.devlink.post_service.config.Constants;

@Service
@RequiredArgsConstructor
public class WebSocketEventPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public void publishUserEvent(Long userId, String eventType, Object payload) {
        messagingTemplate.convertAndSend("/topic/user/" + userId, new WsEvent(eventType, payload));
    }

    public void publishPostEvent(Long postId, String eventType, Object payload) {
        messagingTemplate.convertAndSend("/topic/post/" + postId, new WsEvent(eventType, payload));
    }

    public void publishAdminEvent(String eventType, Object payload) {
        messagingTemplate.convertAndSend(Constants.ADMIN_TOPIC, new WsEvent(eventType, payload));
    }
}
