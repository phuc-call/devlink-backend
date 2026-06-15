package com.devlink.user_service.kafka;

import com.devlink.user_service.dto.event.ReportReviewedEvent;
import com.devlink.user_service.entity.Notification;
import com.devlink.user_service.entity.enums.NotificationType;
import com.devlink.user_service.repository.NotificationRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static com.devlink.user_service.config.Constants.*;

@Component
@Slf4j
@RequiredArgsConstructor
public class ReportReviewedListener {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final RedisTemplate<String, Object> redisTemplate;


    @KafkaListener(topics = "report.reviewed", groupId = "user-service-group")
    public void handle(ReportReviewedEvent event) {
        if (event.isApproved()) {
            handleApproved(event);
        } else {
            handleRejected(event);
        }
    }

    private void handleApproved(ReportReviewedEvent event) {
        Notification reporterNotif = notificationRepository.save(Notification.builder()
                .userId(event.getReporterId())
                .actorId(SYSTEM_ACTOR_ID)
                .type(NotificationType.REPORT_REVIEWED)
                .content("We have confirmed that this content violates our community standards " +
                        "and appropriate action has been taken. Thank you for your contribution.")
                .isRead(false)
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .build());

        saveToRedis(reporterNotif.getId(), event);

        if (event.getTargetUserId() != null) {
            notificationRepository.save(Notification.builder()
                    .userId(event.getTargetUserId())
                    .actorId(SYSTEM_ACTOR_ID)
                    .type(NotificationType.REPORT_VIOLATION)
                    .content("Your content has been found to violate our community standards " +
                            "and has been removed. Reason: " + event.getReviewNote())
                    .isRead(false)
                    .isHidden(false)
                    .createdAt(LocalDateTime.now())
                    .build());

            userRepository.findById(event.getTargetUserId()).ifPresent(user ->
                    emailService.sendEmailDTO(
                            user.getEmail(),
                            "REPORT_VIOLATION",
                            Map.of(
                                    "username", user.getUsername(),
                                    "reason", event.getReviewNote() != null ? event.getReviewNote() : "",
                                    "restrictionType", event.getRestrictionType() != null ? event.getRestrictionType() : ""
                            )
                    )
            );
        }

        log.info("[ReportReviewed] Approved — reporterId={}, violatorId={}, notifId={}",
                event.getReporterId(), event.getTargetUserId(), reporterNotif.getId());
    }

    private void handleRejected(ReportReviewedEvent event) {
        Notification reporterNotif = notificationRepository.save(Notification.builder()
                .userId(event.getReporterId())
                .actorId(SYSTEM_ACTOR_ID)
                .type(NotificationType.REPORT_REVIEWED)
                .content("We have reviewed your report and found that this content " +
                        "does not violate our community standards.")
                .isRead(false)
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .build());

        saveToRedis(reporterNotif.getId(), event);

        log.info("[ReportReviewed] Rejected — reporterId={}, notifId={}",
                event.getReporterId(), reporterNotif.getId());
    }

    private void saveToRedis(Long notificationId, ReportReviewedEvent event) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("reportId", event.getReportId());
            payload.put("reporterId", event.getReporterId());
            payload.put("targetId", event.getTargetId());
            payload.put("targetType", event.getTargetType());
            payload.put("reason", event.getReason() != null ? event.getReason() : "");
            payload.put("description", event.getDescription() != null ? event.getDescription() : "");

            String key = String.format(REPORT_NOTIFICATION_KEY, notificationId);
            redisTemplate.opsForValue().set(key, payload, REPORT_NOTIFICATION_TTL_DAYS, TimeUnit.DAYS);
            log.info("[ReportReviewed] Redis saved key={}", key);
        } catch (Exception e) {
            log.error("[ReportReviewed] Redis save failed for notifId={}", notificationId, e);
        }
    }
}