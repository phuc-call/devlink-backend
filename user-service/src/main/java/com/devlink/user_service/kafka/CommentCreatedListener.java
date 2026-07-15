package com.devlink.user_service.kafka;

import com.devlink.user_service.config.WsEventConstants;
import com.devlink.user_service.dto.event.CommentCreatedEvent;
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
public class CommentCreatedListener {

    private final NotificationRepository notificationRepository;
    private final WebSocketEventPublisher webSocketEventPublisher;

    @KafkaListener(topics = "comment.created", groupId = "user-service-group")
    public void handle(CommentCreatedEvent event) {
        if (event.getReceiverId() == null || event.getActorId() == null) {
            log.warn("[Comment] Invalid comment event: actorId={}, receiverId={}",
                    event.getActorId(), event.getReceiverId());
            return;
        }

        if (event.getReceiverId().equals(event.getActorId())) {
            return;
        }

        Notification saved = notificationRepository.save(Notification.builder()
                .userId(event.getReceiverId())
                .actorId(event.getActorId())
                .type(NotificationType.COMMENT)
                .content("đã bình luận vào bài viết của bạn.")
                .isRead(false)
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .referenceId(event.getPostId()) // Truyền postId để click vào chuyển tới bài viết
                .referenceType("POST")
                .build());

        webSocketEventPublisher.publishUserEvent(event.getReceiverId(), WsEventConstants.NEW_NOTIFICATION, null);

        log.info("[Comment] Saved notification id={} receiverId={} actorId={} postId={} commentId={}",
                saved.getId(),
                event.getReceiverId(),
                event.getActorId(),
                event.getPostId(),
                event.getCommentId());
    }
}
