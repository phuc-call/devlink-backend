package com.devlink.user_service.service.impl;

import com.devlink.user_service.repository.UserBlockRepository;
import com.devlink.user_service.service.UserBlockService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class UserBlockServiceImpl implements UserBlockService {
    private final UserBlockRepository userBlockRepository;

    public boolean checkIfUserIsBlocked(Long a, Long b) {
        return userBlockRepository.isBlocked(a, b)
                || userBlockRepository.isBlocked(b, a);
    }
}
