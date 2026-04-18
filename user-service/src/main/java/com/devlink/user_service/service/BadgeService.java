package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.BadgeGrantResponse;

public interface BadgeService {
    void evaluateUser(Long userId);
    BadgeGrantResponse grantRedTick(Long userId, String reason, String adminUsername);
}
