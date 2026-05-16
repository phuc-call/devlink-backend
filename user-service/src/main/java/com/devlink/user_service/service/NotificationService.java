package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.NotificationBrithDay;
import com.devlink.user_service.dto.reponse.NotificationResponse;
import com.devlink.user_service.dto.request.NotificationActionRequest;
import com.devlink.user_service.dto.request.NotificationPasswordSetupRequest;
import com.devlink.user_service.entity.enums.NotificationType;
import org.springframework.data.domain.Page;

import java.util.List;

public interface NotificationService {
    // Birthday
    List<NotificationBrithDay> birthdayAnnouncement();

    void notifyFollowerIfBirthdayActive(Long followerId, Long birthdayUserId);

    // Follow
    void followAnnouncement(Long actorId, Long receiverId, NotificationType type);

    // General
    Page<NotificationResponse> getNotifications(int page, int size);

    int countUnread();

    void markAsRead(Long notificationId);

    void markAllAsRead();

    void handleAction(Long userId, NotificationActionRequest request);

    public void setUpNotificationOTP();
    public void verifyOtpAndSetPassword(NotificationPasswordSetupRequest request);

}
