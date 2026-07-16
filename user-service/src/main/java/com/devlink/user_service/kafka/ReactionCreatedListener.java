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

        Long refId = event.getPostId() != null ? event.getPostId() : event.getTargetId();
        String refType = switch (event.getTargetType()) {
            case "COMMENT" -> "COMMENT_" + event.getTargetId();
            case "REPLY", "COMMENT_REPLY" -> "REPLY_" + event.getTargetId();
            default -> event.getTargetType();
        };

        Notification saved = notificationRepository.save(Notification.builder()
                .userId(event.getReceiverId())
                .actorId(event.getActorId())
                .type(NotificationType.REACTION)
                .content(content)
                .isRead(false)
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .referenceId(refId)
                .referenceType(refType)
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
        String reactionStr = mapReactionType(event.getReactionType());
        return switch (event.getTargetType()) {
            case "POST" -> "đã bày tỏ " + reactionStr + " về bài viết của bạn.";
            case "COMMENT" -> "đã bày tỏ " + reactionStr + " về bình luận của bạn.";
            case "REPLY", "COMMENT_REPLY" -> "đã bày tỏ " + reactionStr + " về phản hồi của bạn.";
            default -> "đã bày tỏ " + reactionStr + " về nội dung của bạn.";
        };
    }

    private String mapReactionType(String reactionType) {
        if (reactionType == null) return "cảm xúc";
        return switch (reactionType.toUpperCase()) {
            case "LIKE" -> "Thích";
            case "LOVE" -> "Yêu thích";
            case "HA_HA", "HAHA" -> "Haha";
            case "WOW" -> "Wow";
            case "SAD" -> "Buồn";
            case "ANGRY" -> "Phẫn nộ";
            default -> "cảm xúc";
        };
    }
}