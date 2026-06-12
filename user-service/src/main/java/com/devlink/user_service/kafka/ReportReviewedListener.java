package com.devlink.user_service.kafka;

import com.devlink.user_service.dto.event.ReportReviewedEvent;
import com.devlink.user_service.entity.Notification;
import com.devlink.user_service.entity.enums.NotificationType;
import com.devlink.user_service.repository.NotificationRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

import static com.devlink.user_service.config.Constants.SYSTEM_ACTOR_ID;

@Component
@Slf4j
@RequiredArgsConstructor
public class ReportReviewedListener {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @KafkaListener(topics = "report.reviewed", groupId = "user-service-group")
    public void handle(ReportReviewedEvent event) {
        if (event.isApproved()) {
            handleApproved(event);
        } else {
            handleRejected(event);
        }
    }

    //The post violates the rules--- notify both the report and the violator.

    private void handleApproved(ReportReviewedEvent event) {
        // 1. Thông báo cho reporter
        notificationRepository.save(Notification.builder()
                .userId(event.getReporterId())
                .actorId(SYSTEM_ACTOR_ID)
                .type(NotificationType.REPORT_REVIEWED)
                .content("We have confirmed that this content violates our community standards " +
                        "and appropriate action has been taken. Thank you for your contribution.")
                .isRead(false)
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .build());

        // Thông báo cho violator
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

            //  Gửi email cho violator
            userRepository.findById(event.getTargetUserId()).ifPresent(user ->
                    emailService.sendEmailDTO(
                            user.getEmail(),
                            "REPORT_VIOLATION",
                            Map.of(
                                    "username", user.getUsername(),
                                    "reason",   event.getReviewNote() != null ? event.getReviewNote() : "",
                                    "restrictionType", event.getRestrictionType() != null ? event.getRestrictionType() : ""
                            )
                    )
            );
        }

        log.info("[ReportReviewed] Approved — reporterId={}, violatorId={}",
                event.getReporterId(), event.getTargetUserId());
    }

    /** Bài viết không vi phạm thông báo cho reporter */
    private void handleRejected(ReportReviewedEvent event) {
        notificationRepository.save(Notification.builder()
                .userId(event.getReporterId())
                .actorId(SYSTEM_ACTOR_ID)
                .type(NotificationType.REPORT_REVIEWED)
                .content("We have reviewed your report and found that this content " +
                        "does not violate our community standards.")
                .isRead(false)
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .build());

        log.info("[ReportReviewed] Rejected — reporterId={}", event.getReporterId());
    }
}
