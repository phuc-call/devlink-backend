package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.NotificationBrithDay;

import java.util.List;

public interface NotificationService {
     List<NotificationBrithDay> birthdayAnnouncement();
}
