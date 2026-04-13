package com.devlink.user_service.common;

import com.devlink.user_service.entity.User;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.UserProfileRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

// common/UserHelper.java
@Component
@RequiredArgsConstructor
public class UserHelper {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    public User getCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

}