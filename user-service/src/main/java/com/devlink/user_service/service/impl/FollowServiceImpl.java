package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.reponse.FollowResponse;
import com.devlink.user_service.dto.reponse.PageResponse;
import com.devlink.user_service.entity.Follow;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserProfile;
import com.devlink.user_service.entity.enums.FollowStatus;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.UserProfileRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.FollowService;
import com.devlink.user_service.service.UserBlockService;
import jakarta.transaction.Transactional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@Setter
@Getter
@RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {
    private final UserHelper userHelper;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final UserProfileRepository userProfileRepository;

    private final UserBlockService userBlockService;

    @Override
    public void followUser(Long userId) {
        User user = userHelper.getCurrentUser();
        Long currentUserId = user.getId();
        if (currentUserId.equals(userId)) {
            throw new AppException(ErrorCode.CANNOT_FOLLOW_YOURSELF);
        }


        User targetUser = userRepository.findById(userId).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_FOUND));
        boolean isBlocked = userBlockService.checkIfUserIsBlocked(currentUserId, userId);
        if (isBlocked) throw new AppException(ErrorCode.USER_BLOCKED);
        boolean alreadyFollowed = followRepository
                .existsByFollowerIdAndFollowingId(currentUserId, userId);
        if (alreadyFollowed) throw new AppException(ErrorCode.ALREADY_FOLLOWED);

        boolean isFollowBack = followRepository
                .existsByFollowerIdAndFollowingId(userId, currentUserId);
        if (isFollowBack) {
            followRepository.updateStatus(userId, currentUserId, FollowStatus.ACCEPTED);
        }
        FollowStatus status;
        if (isFollowBack) {
            status = FollowStatus.ACCEPTED;

        } else {
            status = Boolean.TRUE.equals(targetUser.getFollowRequestMode()) ?
                    FollowStatus.PENDING : FollowStatus.ACCEPTED;
        }
        if (targetUser.getProfile() != null) {
            targetUser.getProfile().setFollowerCount(targetUser.getProfile().getFollowerCount() + 1);
        }
        if (user.getProfile() != null) {
            user.getProfile().setFollowingCount(user.getProfile().getFollowingCount() + 1);
        }
        Follow follow = Follow.builder()
                .follower(user)
                .following(targetUser)
                .status(status)
                .build();
        followRepository.save(follow);
    }

    @Override
    public void unFollowUser(Long userId) {
        User user = userHelper.getCurrentUser();
        Long currentUserId = user.getId();
        User targetUser = userHelper.getUser(userId);

        boolean alreadyFollowed = followRepository
                .existsByFollowerIdAndFollowingId(currentUserId, userId);
        if (!alreadyFollowed) throw new AppException(ErrorCode.NOT_FOLLOWED);
        boolean isFriend = followRepository
                .existsByFollowerIdAndFollowingId(userId, currentUserId);
        if (isFriend) {
            followRepository.updateStatus(userId, currentUserId, FollowStatus.PENDING);
        }

        followRepository.deleteByFollowerIdAndFollowingId(currentUserId, userId);

        updateFollowCount(user, targetUser);

    }

    @Override
    public void incrementViewCount(Long followingId) {
        User user = userHelper.getCurrentUser();
        Long userId = user.getId();
        followRepository.incrementView(userId, followingId, LocalDateTime.now());
    }

    @Override
    public PageResponse<FollowResponse> getFollowers(Integer pageNumber, Integer pageSize) {
        User user = userHelper.getCurrentUser();
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<Follow> followPage = followRepository.findFollowerList(user.getId(), pageable);
        return buildPageResponse(followPage, true);
    }

    @Override
    public PageResponse<FollowResponse> getFollowing(Integer pageNumber, Integer pageSize) {
        User user = userHelper.getCurrentUser();
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<Follow> followPage = followRepository.findFollowingList(user.getId(), pageable);
        return buildPageResponse(followPage, false);
    }

    @Override
    public void cancelFollowRequest(Long followingId) {
        User user = userHelper.getCurrentUser();
        Long currentUserId = user.getId();
        User targetUser = userHelper.getUser(followingId);
        Follow follow = followRepository.findByFollowerIdAndFollowingId(currentUserId, followingId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        updateFollowCount(user, targetUser);
        followRepository.delete(follow);
    }

    // if true get getFollowers if false getFollowing
    private PageResponse<FollowResponse> buildPageResponse(Page<Follow> followPage, boolean isFollower) {
        List<FollowResponse> content = followPage.stream()
                .map(f -> {
                    User target = isFollower ? f.getFollower() : f.getFollowing();
                    return FollowResponse.builder()
                            .userId(target.getId())
                            .fullName(target.getUsername())
                            .avatar(target.getProfile().getAvatarUrl())
                            .status(f.getStatus())
                            .build();
                }).toList();

        PageResponse<FollowResponse> response = new PageResponse<>();
        response.setContent(content);
        response.setPageNumber(followPage.getNumber());
        response.setHasNext(followPage.hasNext());
        response.setPageSize(followPage.getSize());
        response.setTotalPage(followPage.getTotalPages());
        response.setTotalElement(followPage.getTotalElements());
        return response;
    }


    //TODO: có thể bug logic chỗ này
    private void updateFollowCount(User follower, User following) {
        UserProfile currentUser = follower.getProfile();
        UserProfile targetUser = following.getProfile();

        if (currentUser.getFollowerCount() != null && currentUser.getFollowerCount() > 0) {
            currentUser.setFollowerCount(currentUser.getFollowerCount() - 1);
        }
        if (targetUser.getFollowingCount() != null && targetUser.getFollowingCount() > 0) {
            targetUser.setFollowingCount(targetUser.getFollowingCount() - 1);
        }
        userProfileRepository.save(currentUser);
        userProfileRepository.save(targetUser);

    }

}
