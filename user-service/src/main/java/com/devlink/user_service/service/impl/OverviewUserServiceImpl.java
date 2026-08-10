package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.response.UserOverviewResponse;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserProfile;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.GroupMemberRepository;
import com.devlink.user_service.repository.NotificationRepository;
import com.devlink.user_service.service.OverviewUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OverviewUserServiceImpl implements OverviewUserService {

    private final UserHelper userHelper;
    private final FollowRepository followRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public UserOverviewResponse getUserOverview() {
        User currentUser = userHelper.getCurrentUser();
        Long userId = currentUser.getId();
        UserProfile profile = currentUser.getProfile();

        if (profile == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        LocalDateTime startOfWeek = LocalDateTime.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).withHour(0).withMinute(0).withSecond(0);
        int newFollowersThisWeek = followRepository.countNewFollowersSince(userId, startOfWeek);
        int groupCount = groupMemberRepository.countApprovedGroupsByUserId(userId);
        int unreadNotificationCount = notificationRepository.countUnread(userId);

        return UserOverviewResponse.builder()
                .userId(userId)
                .fullName(profile.getFullName())
                .avatarUrl(profile.getAvatarUrl())
                .badge(currentUser.getBadge())
                .followerCount(profile.getFollowerCount())
                .followingCount(profile.getFollowingCount())
                .newFollowersThisWeek(newFollowersThisWeek)
                .groupCount(groupCount)
                .unreadNotificationCount(unreadNotificationCount)
                .build();
    }
}
