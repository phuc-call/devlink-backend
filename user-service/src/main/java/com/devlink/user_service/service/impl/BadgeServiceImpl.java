package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.event.BadgeGrantedEvent;
import com.devlink.user_service.dto.reponse.BadgeGrantResponse;
import com.devlink.user_service.entity.*;
import com.devlink.user_service.entity.enums.BadgeType;
import com.devlink.user_service.entity.enums.FollowStatus;
import com.devlink.user_service.entity.enums.OutboxStatus;
import com.devlink.user_service.entity.enums.RoleName;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.*;
import com.devlink.user_service.service.BadgeService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Transactional
@Service
@RequiredArgsConstructor
@Slf4j
public class BadgeServiceImpl implements BadgeService {
    private final UserHelper userHelper;
    private final FollowRepository followRepository;

    private final BadgeConfigRepository badgeConfigRepository;
    private final UserRepository userRepository;
    private final BadgeHistoryRepository badgeHistoryRepository;
    private final OutboxRepository outboxRepository;
    private final ObjectMapper object;

    @Override
    public void evaluateUser(Long userId) {

        User user = userHelper.getUser(userId);
        BadgeConfig badgeConfig = badgeConfigRepository.findById(1L).
                orElseGet(BadgeConfig::new);
        BadgeType currentBadType = user.getBadge();
        if (currentBadType.equals(BadgeType.RED_TICK)) return;

        List<Follow> qualifiedFollowing = followRepository.findFollowingListByFollowerId(userId);

        List<Follow> result = new ArrayList<>();
        for (Follow follower : qualifiedFollowing) {
            UserProfile userProfile = follower.getFollowing().getProfile();
            if (userProfile != null && userProfile.getCompletionPercent() >= badgeConfig.getMinCompletionPercent()) {
                result.add(follower);
            }
        }
        long totalFollowing = result.size();
        int totalPending = 0;
        for (Follow f : result) {
            if (f.getStatus().equals(FollowStatus.PENDING)) {
                totalPending++;
            }
        }
        double pendingRatio;
        if (totalFollowing == 0) {
            pendingRatio = 0;
        } else {
            pendingRatio = (totalPending * 100.0) / totalFollowing;
        }

        log.debug("[BADGE] userId={} totalReal={} pendingReal={} pendingRatio={}%",
                userId, totalFollowing, totalPending, pendingRatio);

        if (currentBadType.equals(BadgeType.POPULAR) && totalFollowing > badgeConfig.getPopularThreshold()
                && isOverGracePeriod(userId, BadgeType.POPULAR)) {
            doAutoGrantBadge(user, BadgeType.NONE, totalFollowing);
            return;
        }
        if (currentBadType.equals(BadgeType.BLUE_TICK) &&
                (totalFollowing > badgeConfig.getBleuTickThreshold() || badgeConfig.getBleuTickThreshold() > pendingRatio)
                && isOverGracePeriod(userId, BadgeType.BLUE_TICK)) {
            doAutoGrantBadge(user, BadgeType.POPULAR, totalFollowing);
            return;
        }
        if (totalFollowing >= badgeConfig.getPopularThreshold()
                && currentBadType.equals(BadgeType.NONE)) {
            doAutoGrantBadge(user, BadgeType.POPULAR, totalFollowing);
            return;
        }

        if (totalFollowing >= badgeConfig.getBleuTickThreshold()
                && pendingRatio >= badgeConfig.getBlueTickPendingRatio()
                && !currentBadType.equals(BadgeType.BLUE_TICK)) {
            doAutoGrantBadge(user, BadgeType.BLUE_TICK, totalFollowing);
        }
    }

    private void evaluatePopular(User user, Long userId, BadgeType current, BadgeConfig config, Long total) {
        if(total<config.getPopularThreshold()&&
        current.equals(BadgeType.POPULAR)&&
        isOverGracePeriod(userId,BadgeType.POPULAR)){
            doAutoGrantBadge(user,BadgeType.POPULAR,total);
            return;
        }
        if(total>config.getPopularThreshold()&&current.equals(BadgeType.NONE)){
            doAutoGrantBadge(user,BadgeType.POPULAR,total);
        }
    }

    @Override
    public BadgeGrantResponse grantRedTick(Long userId, String reason, String adminUsername) {
        User user = userHelper.getUser(userId);
        boolean isRedTick = user.getBadge().equals(BadgeType.RED_TICK);
        if (isRedTick) {
            throw new AppException(ErrorCode.BADGE_ALREADY_GRANTED);
        }
        boolean isRole = user.getRoles().stream().anyMatch(r -> r.getRole().getName().equals(RoleName.SCANNER));
        if (isRole) {
            throw new AppException(ErrorCode.INSUFFICIENT_ROLE_FOR_BADGE);
        }
        doManualGrantBadge(user, adminUsername, reason);
        return BadgeGrantResponse.builder()
                .userId(userId)
                .badge(BadgeType.RED_TICK)
                .message("RED_TICK granted successfully")
                .grantedAt(LocalDateTime.now())
                .build();

    }

    private void doAutoGrantBadge(User user, BadgeType newBadgeType, Long followerCount) {
        user.setBadge(newBadgeType);
        userRepository.save(user);
        badgeHistoryRepository.save(
                BadgeHistory.builder()
                        .user(user)
                        .badgeType(newBadgeType)
                        .grantedBy("SYSTEM")
                        .reason(null)
                        .followerCountSnapshot(followerCount)
                        .build()
        );
        publishBadgeGrantedEvent(user, newBadgeType, "SYSTEM", null);
    }

    private void doManualGrantBadge(User user,
                                    String adminUsername, String reason) {
        user.setBadge(BadgeType.RED_TICK);
        userRepository.save(user);
        badgeHistoryRepository.save(
                BadgeHistory.builder()
                        .user(user)
                        .badgeType(BadgeType.RED_TICK)
                        .grantedBy(adminUsername)
                        .reason(reason)
                        .followerCountSnapshot(null)
                        .build());
        publishBadgeGrantedEvent(user, BadgeType.RED_TICK, adminUsername, reason);
    }

    private boolean isOverGracePeriod(Long userId, BadgeType badgeType) {
        BadgeConfig badgeConfig = badgeConfigRepository.findById(1L).orElseGet(BadgeConfig::new);
        Optional<BadgeHistory> lastBadge = badgeHistoryRepository.
                findTopByUserIdAndBadgeTypeOrderByCreatedAtDesc(userId, badgeType);
        return lastBadge.map(h -> h.getCreatedAt().plusDays(badgeConfig.getGracePeriodDays())
                .isBefore(LocalDateTime.now())).orElse(false);
    }

    private void publishBadgeGrantedEvent(User user, BadgeType badgeType,
                                          String grantedBy, String reason) {
        BadgeGrantedEvent event = BadgeGrantedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .userId(user.getId())
                .badgeType(badgeType)
                .grantedBy(grantedBy)
                .reason(reason)
                .occurredAt(LocalDateTime.now())
                .build();
        try {
            outboxRepository.save(
                    OutboxEvent.builder()
                            .eventId(event.getEventId())
                            .topic("badge_granted")
                            .payload(object.writeValueAsString(event))
                            .partitionKey(String.valueOf(user.getId()))
                            .status(OutboxStatus.PENDING)
                            .build());

        } catch (JsonProcessingException e) {
            log.error("[BADGE] Failed to serialize BadgeGrantedEvent userId={}: {}",
                    user.getId(), e.getMessage());
        }

    }
}
