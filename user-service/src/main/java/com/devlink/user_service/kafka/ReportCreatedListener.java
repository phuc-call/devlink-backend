package com.devlink.user_service.kafka;

import com.devlink.user_service.dto.event.ReportCreatedEvent;
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
public class ReportCreatedListener {
    private static final Long SYSTEM_ACTOR_ID = 0L;
    private final NotificationRepository notificationRepository;
    @KafkaListener(topics = "report.created", groupId = "user-service-group")
    public void handle(ReportCreatedEvent event) {
        String content = event.isUpdate()
                ? "Your report has been updated and is pending review."
                : "Your report has been received and is pending review.";
        notificationRepository.save(Notification.builder()
                .userId(event.getReporterId())
                .actorId(SYSTEM_ACTOR_ID)
                .type(NotificationType.REPORT)
                .content(content)
                .isRead(false)
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .build());
        log.info("[Report] Saved notification for reporterId={}, targetId={}, isUpdate={}",
                event.getReporterId(), event.getTargetId(), event.isUpdate());
    }
}