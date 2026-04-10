package com.devlink.user_service.common;

import com.devlink.user_service.entity.User;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

// common/UserHelper.java
@Component
@RequiredArgsConstructor
public class UserHelper {
    private final UserRepository userRepository;

    public User getCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}