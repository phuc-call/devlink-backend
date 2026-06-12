package com.devlink.user_service.kafka;

import com.devlink.user_service.dto.event.ReportCreatedEvent;
import com.devlink.user_service.dto.redis.ReportNotificationRedis;
import com.devlink.user_service.entity.Notification;
import com.devlink.user_service.entity.enums.NotificationType;
import com.devlink.user_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import static com.devlink.user_service.config.Constants.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReportCreatedListener {

    private final NotificationRepository notificationRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @KafkaListener(topics = "report.created", groupId = "user-service-group")
    public void handle(ReportCreatedEvent event) {
        String content = event.isUpdate()
                ? "Your report has been updated and is pending review."
                : "Your report has been received and is pending review.";

        // Save notification — lấy ID ngay sau save
        Notification saved = notificationRepository.save(Notification.builder()
                .userId(event.getReporterId())
                .actorId(SYSTEM_ACTOR_ID)
                .type(NotificationType.REPORT)
                .content(content)
                .isRead(false)
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .build());

        // Lưu payload vào Redis — key gắn chính xác với notificationId vừa save
        String key = String.format(REPORT_NOTIFICATION_KEY, saved.getId());
        ReportNotificationRedis payload = ReportNotificationRedis.builder()
                .reportId(event.getReportId())
                .reporterId(event.getReporterId())
                .targetId(event.getTargetId())
                .targetType(event.getTargetType())
                .reason(event.getReason())
                .description(event.getDescription())
                .build();

        redisTemplate.opsForValue().set(key, payload, REDIS_TTL_DAYS, TimeUnit.DAYS);

        log.info("[Report] Saved notification id={} for reporterId={}, targetId={}",
                saved.getId(), event.getReporterId(), event.getTargetId());
    }
}