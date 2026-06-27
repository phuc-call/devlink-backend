package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.response.FollowResponse;
import com.devlink.user_service.dto.response.PageResponse;
import com.devlink.user_service.dto.response.UserFollowingCardResponse;
import com.devlink.user_service.entity.Follow;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.enums.FollowActionResult;
import com.devlink.user_service.entity.enums.FollowListType;
import com.devlink.user_service.entity.enums.FollowStatus;
import com.devlink.user_service.entity.enums.NotificationType;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.NotificationRepository;
import com.devlink.user_service.repository.UserProfileRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.security.SecurityUtils;
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
public class    FollowServiceImpl implements FollowService {
    private final UserHelper userHelper;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final UserProfileRepository userProfileRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationServiceImpl notificationService;

    private final UserBlockService userBlockService;

    @Override
    public void followUser(Long userId) {
        User user = userHelper.getCurrentUser();
        Long currentUserId = user.getId();
        if (currentUserId.equals(userId)) {
            throw new  AppException(ErrorCode.CANNOT_FOLLOW_YOURSELF);
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
            followRepository.save(Follow.builder()
                    .follower(user).following(targetUser)
                    .viewCount(0).status(FollowStatus.ACCEPTED)
                    .build());
            userProfileRepository.increaseFollowerCount(targetUser.getId()); // B +1 follower
            userProfileRepository.increaseFollowingCount(currentUserId);
            //announcement
            notificationService.followAnnouncement(currentUserId, userId, NotificationType.FOLLOW_BACK);
        } else if (Boolean.FALSE.equals(targetUser.getFollowRequestMode())) {
            // Auto 2 A→B + B→A
            followRepository.save(Follow.builder()
                    .follower(user).following(targetUser)
                    .viewCount(0).status(FollowStatus.ACCEPTED)
                    .build());
            followRepository.save(Follow.builder()
                    .follower(targetUser).following(user)
                    .viewCount(0).status(FollowStatus.ACCEPTED)
                    .build());
            userProfileRepository.increaseFollowerCount(targetUser.getId());
            userProfileRepository.increaseFollowingCount(currentUserId);
            userProfileRepository.increaseFollowerCount(currentUserId);       // A +1 follower
            userProfileRepository.increaseFollowingCount(targetUser.getId()); // B +1 following
            //announcement
            notificationService.followAnnouncement(currentUserId, userId,NotificationType.FOLLOW);

        } else {

            followRepository.save(Follow.builder()
                    .follower(user).following(targetUser)
                    .viewCount(0).status(FollowStatus.PENDING)
                    .build());
            userProfileRepository.increaseFollowerCount(targetUser.getId()); // B +1 follower
            userProfileRepository.increaseFollowingCount(currentUserId);     // A +1 following
            //announcement
            notificationService.followAnnouncement(currentUserId, userId,NotificationType.FOLLOW_REQUEST);
        }
    }


    @Override
    public Page<UserFollowingCardResponse> getFollowingCards(int page, int size) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        return followRepository.getFollowingCards(currentUserId, pageable);
    }


    @Override
    public void unFollowUser(Long userId) {
        User user = userHelper.getCurrentUser();
        Long currentUserId = user.getId();
        User targetUser = userHelper.getUser(userId);

        boolean alreadyFollowed = followRepository
                .existsByFollowerIdAndFollowingId(currentUserId, targetUser.getId());
        if (!alreadyFollowed) throw new AppException(ErrorCode.NOT_FOLLOWED);
        boolean isFriend = followRepository
                .existsByFollowerIdAndFollowingId( targetUser.getId(), currentUserId);
        if (isFriend) {
            followRepository.updateStatus(userId, currentUserId, FollowStatus.PENDING);
        }

        followRepository.deleteByFollowerIdAndFollowingId(currentUserId, userId);
        userProfileRepository.decreaseFollowerCount(targetUser.getId());
        userProfileRepository.decreaseFollowingCount(currentUserId);
        //Notification
        notificationRepository.deleteByActorIdAndUserIdAndType(
                currentUserId, userId, NotificationType.FOLLOW_REQUEST
        );
        notificationRepository.deleteByActorIdAndUserIdAndType(
                currentUserId, userId, NotificationType.FOLLOW
        );
        notificationRepository.deleteByActorIdAndUserIdAndType(
                currentUserId, userId,NotificationType.FOLLOW_BACK
        );


    }

    @Override
    public List<Long> getFriendIds(Long userId) {
        return followRepository.findFriendIds(userId);
    }
    @Override
    public FollowActionResult getFollowStatus(Long userId) {
        Long currentUserId = userHelper.getCurrentUser().getId();

        boolean iFollowAccepted = followRepository.existsByFollowerIdAndFollowingIdAndStatus(
                currentUserId, userId, FollowStatus.ACCEPTED);
        boolean theyFollowAccepted = followRepository.existsByFollowerIdAndFollowingIdAndStatus(
                userId, currentUserId, FollowStatus.ACCEPTED);
        boolean iFollowPending = followRepository.existsByFollowerIdAndFollowingIdAndStatus(
                currentUserId, userId, FollowStatus.PENDING);

        if (iFollowAccepted && theyFollowAccepted) return FollowActionResult.FRIEND;
        if (iFollowAccepted) return FollowActionResult.FOLLOWING;
        if (iFollowPending) return FollowActionResult.FOLLOWING;
        return FollowActionResult.NOT_FOLLOWING;
    }

    @Override
    public void incrementViewCount(Long followingId) {
        User user = userHelper.getCurrentUser();
        Long userId = user.getId();
        followRepository.incrementView(userId, followingId, LocalDateTime.now());
    }

    @Override
    public PageResponse<FollowResponse> getFollowList(FollowListType type, Integer pageNumber, Integer pageSize) {
        User user = userHelper.getCurrentUser();
        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        switch (type) {
            case FOLLOWING -> {
                return buildPageResponse(followRepository.findFollowingList(user.getId(), pageable));
            }
            case FOLLOWERS -> {
                return buildPageResponse(followRepository.findFollowerList(user.getId(), pageable));
            }
            case FRIENDS -> {
                return buildPageResponse(followRepository.findFriendsList(user.getId(), pageable));
            }
        }
        return null;
    }

    @Override
    public void cancelFollowRequest(Long followingId) {
        User user = userHelper.getCurrentUser();
        Long currentUserId = user.getId();
        User targetUser = userHelper.getUser(followingId);
        Follow follow = followRepository.findByFollowerIdAndFollowingId(currentUserId, followingId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        followRepository.delete(follow);
        userProfileRepository.decreaseFollowingCount(currentUserId);
        userProfileRepository.decreaseFollowerCount(targetUser.getId());
    }

    private PageResponse<FollowResponse> buildPageResponse(Page<FollowResponse> page) {
        PageResponse<FollowResponse> response = new PageResponse<>();
        response.setContent(page.getContent());
        response.setPageNumber(page.getNumber());
        response.setHasNext(page.hasNext());
        response.setPageSize(page.getSize());
        response.setTotalPage(page.getTotalPages());
        response.setTotalElement(page.getTotalElements());
        return response;
    }
}
