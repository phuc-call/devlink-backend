package com.devlink.user_service.service;

import com.devlink.user_service.dto.response.NotificationBrithDay;
import com.devlink.user_service.dto.response.NotificationResponse;
import com.devlink.user_service.dto.request.NotificationActionRequest;
import com.devlink.user_service.dto.request.NotificationPasswordSetupRequest;
import com.devlink.user_service.entity.enums.CountNotification;
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

    int countUnread(CountNotification count);

    void markAsRead(Long notificationId);

    void markAllAsRead();

    void handleAction(Long userId, NotificationActionRequest request);

    void setUpNotificationOTP();

    void verifyOtpAndSetPassword(NotificationPasswordSetupRequest request);

    boolean checkPasswordNotification();

}
