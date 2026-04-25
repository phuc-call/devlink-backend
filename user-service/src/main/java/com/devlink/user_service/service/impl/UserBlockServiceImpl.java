package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserBlock;
import com.devlink.user_service.entity.enums.FollowStatus;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.UserBlockRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.UserBlockService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class UserBlockServiceImpl implements UserBlockService {
    private final UserBlockRepository userBlockRepository;
    private final UserHelper userHelper;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;


    public boolean checkIfUserIsBlocked(Long a, Long b) {
        return userBlockRepository.isBlocked(a, b)
                || userBlockRepository.isBlocked(b, a);
    }

    @Override
    public void blockUser(Long userId) {
        User user = userHelper.getCurrentUser();
        Long currentUserId = user.getId();
        boolean isUser = userRepository.existsById(userId);
        if (!isUser) throw new AppException(ErrorCode.USER_NOT_FOUND);
        if (currentUserId.equals(userId)) return;
        boolean isBlock = userBlockRepository.isBlocked(currentUserId, userId);
        if (isBlock) throw new AppException(ErrorCode.ALREADY_BLOCKED);

        boolean iFollowThem = followRepository.existsByFollowerIdAndFollowingId(currentUserId, userId);
        if (iFollowThem) {
            followRepository.deleteByFollowerIdAndFollowingId(currentUserId, userId);
        }

        boolean theyFollowMe = followRepository.existsByFollowerIdAndFollowingId(userId, currentUserId);
        if (theyFollowMe) {
            followRepository.updateStatus(currentUserId, userId, FollowStatus.PENDING);
            followRepository.deleteByFollowerIdAndFollowingId(userId, currentUserId);
        }
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        userBlockRepository.save(UserBlock.builder()
                .blocker(user)
                .blockedId(target.getId())
                .build());
    }

    @Override
    public void unBlockUser(Long userId) {
        User user = userHelper.getCurrentUser();
        Long currentUserId = user.getId();
        boolean isUser = userRepository.existsById(userId);
        if (!isUser) throw new AppException(ErrorCode.USER_NOT_FOUND);
        boolean isBlock = userBlockRepository.isBlocked(currentUserId, userId);
        if (!isBlock) throw new AppException(ErrorCode.NOT_BLOCKED);
        userBlockRepository.deleteByBlockerIdAndBlockedId(currentUserId, userId);
    }

}
