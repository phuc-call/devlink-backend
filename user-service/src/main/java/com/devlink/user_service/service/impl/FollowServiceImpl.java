package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.entity.Follow;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.enums.FollowStatus;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.UserBlockRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.FollowService;
import jakarta.transaction.Transactional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Service;

@Service @Transactional
@Setter @Getter @RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {
    private final UserHelper userHelper;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final UserBlockRepository userBlockRepository;
    @Override
    public void followUser(Long userId) {
        User user = userHelper.getCurrentUser();
        Long currentUserId = user.getId();
        if (currentUserId.equals(userId)) {
            throw new AppException(ErrorCode.CANNOT_FOLLOW_YOURSELF);
        }
        User targetUser = userRepository.findById(userId).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_FOUND));
        boolean isBlocked =checkIfUserIsBlocked(currentUserId, userId);
        if (isBlocked) throw new AppException(ErrorCode.USER_BLOCKED);
        boolean alreadyFollowed = followRepository
                .existsByFollowerIdAndFollowingId(currentUserId, userId);
        if (alreadyFollowed) throw new AppException(ErrorCode.ALREADY_FOLLOWED);

        boolean isFollowBack =followRepository
                .existsByFollowerIdAndFollowingId(userId,currentUserId);
        if(isFollowBack){
            followRepository.updateStatus(userId, currentUserId, FollowStatus.ACCEPTED);
        }
        FollowStatus status = isFollowBack?FollowStatus.ACCEPTED:FollowStatus.PENDING;
        Follow follow = Follow.builder()
                .follower(user)
                .following(targetUser)
                .status(status)
                .build();
        followRepository.save(follow);
    }

    @Override
    public void unFollowUser(Long userId){
        User user=userHelper.getCurrentUser();
        Long currentUserId=user.getId();
        boolean targetUser = userRepository.existsByUserId(userId);
        if(!targetUser) throw new AppException(ErrorCode.USER_NOT_FOUND);

        boolean alreadyFollowed = followRepository
                .existsByFollowerIdAndFollowingId(currentUserId, userId);
        if (!alreadyFollowed) throw new AppException(ErrorCode.NOT_FOLLOWED);
        boolean isFriend = followRepository
                .existsByFollowerIdAndFollowingId(userId, currentUserId);
        if(isFriend){
            followRepository.updateStatus(userId,currentUserId,FollowStatus.PENDING);
        }

        followRepository.deleteByFollowerIdAndFollowingId(currentUserId, userId);
    }

    private boolean checkIfUserIsBlocked(Long a, Long b){
        return userBlockRepository.isBlocked(a, b)
                || userBlockRepository.isBlocked(b, a);
    }




}
