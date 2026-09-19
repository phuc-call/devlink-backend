package com.devlink.chat_service.kafka.consumer;

import com.devlink.chat_service.dto.event.FriendshipCreatedEvent;
import com.devlink.chat_service.dto.event.GroupCreatedEvent;
import com.devlink.chat_service.service.ConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationEventListener {

    private final ConversationService conversationService;

    @KafkaListener(topics = "friendship-created", groupId = "chat-service-group")
    public void handleFriendshipCreated(FriendshipCreatedEvent event) {
        if (event == null || event.getUser1Id() == null || event.getUser2Id() == null) return;
        log.info("Received friendship-created event for users {} and {}", event.getUser1Id(), event.getUser2Id());
        try {
            conversationService.createDirectConversationAuto(event.getUser1Id(), event.getUser2Id());
        } catch (Exception e) {
            log.error("Failed to auto-create conversation for users {} and {}", event.getUser1Id(), event.getUser2Id(), e);
        }
    }

    @KafkaListener(topics = "group-created", groupId = "chat-service-group")
    public void handleGroupCreated(GroupCreatedEvent event) {
        if (event == null || event.getGroupId() == null) return;
        log.info("Received group-created event for group id={} name={}", event.getGroupId(), event.getGroupName());
        try {
            conversationService.createGroupConversationAuto(event.getGroupId(), event.getGroupName(), event.getAvatarUrl(), event.getMemberIds());
        } catch (Exception e) {
            log.error("Failed to auto-create group conversation for group {}", event.getGroupId(), e);
        }
    }
}
