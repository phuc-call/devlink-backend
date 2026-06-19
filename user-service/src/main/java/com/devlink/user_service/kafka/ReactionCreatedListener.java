package com.devlink.user_service.kafka;

import com.devlink.user_service.dto.event.ReactionCreatedEvent;
import com.devlink.user_service.entity.Notification;
import com.devlink.user_service.entity.enums.NotificationType;
import com.devlink.user_service.repository.NotificationRepository;
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
                .build());

        log.info("[Reaction] Saved notification id={} receiverId={} actorId={} targetType={} targetId={}",
                saved.getId(),
                event.getReceiverId(),
                event.getActorId(),
                event.getTargetType(),
                event.getTargetId());
    }

    private String buildContent(ReactionCreatedEvent event) {
        return switch (event.getTargetType()) {
            case "POST" -> "Someone reacted to your post.";
            case "COMMENT" -> "Someone reacted to your comment.";
            case "REPLY" -> "Someone reacted to your reply.";
            default -> "Someone reacted to your content.";
        };
    }
}