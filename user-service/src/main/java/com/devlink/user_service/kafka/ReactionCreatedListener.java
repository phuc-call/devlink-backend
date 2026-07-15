package com.devlink.user_service.kafka;

import com.devlink.user_service.dto.event.ReactionCreatedEvent;
import com.devlink.user_service.config.WsEventConstants;
import com.devlink.user_service.entity.Notification;
import com.devlink.user_service.entity.enums.NotificationType;
import com.devlink.user_service.repository.NotificationRepository;
import com.devlink.user_service.service.WebSocketEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReactionCreatedListener {

    private final NotificationRepository notificationRepository;
    private final WebSocketEventPublisher webSocketEventPublisher;

    @KafkaListener(topics = "reaction.created", groupId = "user-service-group")
    public void handle(ReactionCreatedEvent event) {
        if (event.getReceiverId() == null || event.getActorId() == null) {
            log.warn("[Reaction] Invalid reaction event: actorId={}, receiverId={}",
                    event.getActorId(), event.getReceiverId());
            return;
        }

        if (event.getReceiverId().equals(event.getActorId())) {
            return;
        }

        String content = buildContent(event);

        Notification saved = notificationRepository.save(Notification.builder()
                .userId(event.getReceiverId())
                .actorId(event.getActorId())
                .type(NotificationType.REACTION)
                .content(content)
                .isRead(false)
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .referenceId(event.getTargetId())
                .referenceType(event.getTargetType())
                .build());

        webSocketEventPublisher.publishUserEvent(event.getReceiverId(), WsEventConstants.NEW_NOTIFICATION, null);

        log.info("[Reaction] Saved notification id={} receiverId={} actorId={} targetType={} targetId={}",
                saved.getId(),
                event.getReceiverId(),
                event.getActorId(),
                event.getTargetType(),
                event.getTargetId());
    }

    private String buildContent(ReactionCreatedEvent event) {
        return switch (event.getTargetType()) {
            case "POST" -> "đã bày tỏ cảm xúc về bài viết của bạn.";
            case "COMMENT" -> "đã bày tỏ cảm xúc về bình luận của bạn.";
            case "REPLY" -> "đã bày tỏ cảm xúc về phản hồi của bạn.";
            default -> "đã bày tỏ cảm xúc về nội dung của bạn.";
        };
    }
}