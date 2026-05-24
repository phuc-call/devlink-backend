package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.reponse.BlockStatusResponse;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserBlock;

import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.UserBlockRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.UserBlockService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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
    public List<Long> getBlockedAndBlockerIds(Long userId){
        return userBlockRepository.findBlockedAndBlockerIds(userId);
    }
    @Override
    public BlockStatusResponse blockUser(Long userId) {
        User user = userHelper.getCurrentUser();
        Long currentUserId = user.getId();
        if(currentUserId.equals(userId))
            throw new AppException(ErrorCode.CANNOT_BLOCK_YOURSELF);
        boolean isBlocked = userBlockRepository.isBlocked(currentUserId, userId);


        if(isBlocked){
            userBlockRepository.deleteByBlockerIdAndBlockedId(currentUserId,userId);
            return BlockStatusResponse.builder()
                    .blocked(false)
                    .message("Unblocked the user")
                    .build();
        }else {
            removeFollowRelationships(currentUserId,userId);
            User target = userRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            userBlockRepository.save(UserBlock.builder()
                    .blocker(user)
                    .blockedId(target.getId())
                    .build());
            return BlockStatusResponse.builder()
                    .blocked(true)
                    .message("Blocked the user")
                    .build();
        }
    }
    private void removeFollowRelationships(Long currentUserId, Long userId){
            if (followRepository.existsByFollowerIdAndFollowingId(currentUserId, userId))
                followRepository.deleteByFollowerIdAndFollowingId(currentUserId, userId);

            if (followRepository.existsByFollowerIdAndFollowingId(userId, currentUserId))
                followRepository.deleteByFollowerIdAndFollowingId(userId, currentUserId);
        }
    }


