package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.reponse.BadgeConfigResponse;
import com.devlink.user_service.dto.reponse.BadgeGrantResponse;
import com.devlink.user_service.dto.reponse.BadgeVideoLimitResponse;
import com.devlink.user_service.dto.request.CreateBadgeConfigRequest;
import com.devlink.user_service.dto.request.UpdateBadgeVideoLimitRequest;
import com.devlink.user_service.entity.*;
import com.devlink.user_service.entity.enums.BadgeType;
import com.devlink.user_service.entity.enums.FollowStatus;
import com.devlink.user_service.entity.enums.RoleName;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.*;
import com.devlink.user_service.service.BadgeService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
    private final BadgeVideoLimitRepository badgeVideoLimitRepository;

    @Override
    public void evaluateUser(Long userId) {

        User user = userHelper.getUser(userId);
        BadgeConfig badgeConfig = badgeConfigRepository.findByIsActiveTrue().orElseGet(BadgeConfig::new);
        BadgeType currentBadType = user.getBadge();
        if (currentBadType.equals(BadgeType.RED_TICK))
            return;

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

        evaluatePopular(user, userId, currentBadType, badgeConfig, totalFollowing);
        evaluateBlueTick(user, userId, currentBadType, badgeConfig, totalFollowing, pendingRatio);
    }

    private void evaluatePopular(User user, Long userId, BadgeType current, BadgeConfig config, Long total) {
        if (total < config.getPopularThreshold() &&
                current.equals(BadgeType.POPULAR) &&
                isOverGracePeriod(userId, BadgeType.POPULAR)) {
            doAutoGrantBadge(user, BadgeType.NONE, total);
            return;
        }
        if (total >= config.getPopularThreshold() && current.equals(BadgeType.NONE)) {
            doAutoGrantBadge(user, BadgeType.POPULAR, total);
        }
    }

    private void evaluateBlueTick(User user, Long userId, BadgeType current,
            BadgeConfig config, Long total, double pendingRatio) {
        if (total < config.getBleuTickThreshold() &&
                current.equals(BadgeType.BLUE_TICK) &&
                isOverGracePeriod(userId, BadgeType.BLUE_TICK)) {
            doAutoGrantBadge(user, BadgeType.POPULAR, total);
        }
        if (total >= config.getBleuTickThreshold() && pendingRatio > config.getBlueTickPendingRatio() &&
                current.equals(BadgeType.NONE)) {
            doAutoGrantBadge(user, BadgeType.BLUE_TICK, total);
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

    @Override
    public List<BadgeGrantResponse> grantRedTickBatch(List<Long> userIds, String reason, String adminUsername) {
        List<BadgeGrantResponse> responses = new ArrayList<>();
        for (Long userId : userIds) {
            responses.add(grantRedTick(userId, reason, adminUsername));
        }
        return responses;
    }

    @Override
    public List<BadgeConfigResponse> getAllBadgeConfigs() {
        return badgeConfigRepository.findAll().stream()
                .map(this::toConfigResponse)
                .toList();
    }

    @Override
    public BadgeConfigResponse getActiveBadgeConfig() {
        BadgeConfig config = badgeConfigRepository.findByIsActiveTrue()
                .orElseThrow(() -> new AppException(ErrorCode.VISIBILITY_NOT_FOUND));
        return toConfigResponse(config);
    }

    @Override
    @Transactional
    public BadgeConfigResponse createBadgeConfig(CreateBadgeConfigRequest request, Long adminId) {
        request.validate();

        BadgeConfig config = new BadgeConfig();
        config.setPopularThreshold(request.getPopularThreshold());
        config.setBleuTickThreshold(request.getBleuTickThreshold());
        config.setMinCompletionPercent(request.getMinCompletionPercent());
        config.setBlueTickPendingRatio(request.getBlueTickPendingRatio());
        config.setGracePeriodDays(request.getGracePeriodDays());
        config.setUpdatedBy(adminId);
        config.setIsActive(false);

        BadgeConfig saved = badgeConfigRepository.save(config);
        return toConfigResponse(saved);
    }

    @Override
    @Transactional
    public BadgeConfigResponse updateBadgeConfig(Long id, CreateBadgeConfigRequest request, Long adminId) {
        request.validate();
        BadgeConfig config = badgeConfigRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VISIBILITY_NOT_FOUND));

        config.setPopularThreshold(request.getPopularThreshold());
        config.setBleuTickThreshold(request.getBleuTickThreshold());
        config.setMinCompletionPercent(request.getMinCompletionPercent());
        config.setBlueTickPendingRatio(request.getBlueTickPendingRatio());
        config.setGracePeriodDays(request.getGracePeriodDays());
        config.setUpdatedBy(adminId);

        BadgeConfig saved = badgeConfigRepository.save(config);
        return toConfigResponse(saved);
    }


    @Override
    public List<BadgeVideoLimitResponse> getAllBadgeVideoLimits() {
        return badgeVideoLimitRepository.findAll().stream()
                .map(this::toVideoLimitResponse)
                .toList();
    }

    @Override
    @Transactional
    public BadgeVideoLimitResponse updateBadgeVideoLimit(String badgeType, UpdateBadgeVideoLimitRequest request, Long adminId) {
        BadgeVideoLimit limit = badgeVideoLimitRepository.findById(badgeType)
                .orElseThrow(() -> new AppException(ErrorCode.VISIBILITY_NOT_FOUND));

        limit.setMaxSeconds(request.getMaxSeconds());
        limit.setMaxCount(request.getMaxCount());
        limit.setUpdatedBy(adminId);

        BadgeVideoLimit saved = badgeVideoLimitRepository.save(limit);
        return toVideoLimitResponse(saved);
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
                         .build());

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

    }

    private boolean isOverGracePeriod(Long userId, BadgeType badgeType) {
        BadgeConfig badgeConfig = badgeConfigRepository.findByIsActiveTrue().orElseGet(BadgeConfig::new);
        Optional<BadgeHistory> lastBadge = badgeHistoryRepository
                .findTopByUserIdAndBadgeTypeOrderByCreatedAtDesc(userId, badgeType);
        return lastBadge.map(h -> h.getCreatedAt().plusDays(badgeConfig.getGracePeriodDays())
                .isBefore(LocalDateTime.now())).orElse(false);
    }

    private BadgeConfigResponse toConfigResponse(BadgeConfig config) {
        return BadgeConfigResponse.builder()
                .id(config.getId())
                .popularThreshold(config.getPopularThreshold())
                .bleuTickThreshold(config.getBleuTickThreshold())
                .minCompletionPercent(config.getMinCompletionPercent())
                .blueTickPendingRatio(config.getBlueTickPendingRatio())
                .gracePeriodDays(config.getGracePeriodDays())
                .isActive(config.getIsActive())
                .updatedAt(config.getUpdatedAt())
                .updatedBy(config.getUpdatedBy())
                .build();
    }

    private BadgeVideoLimitResponse toVideoLimitResponse(BadgeVideoLimit limit) {
        return BadgeVideoLimitResponse.builder()
                .badgeType(limit.getBadgeType())
                .maxSeconds(limit.getMaxSeconds())
                .maxCount(limit.getMaxCount())
                .updatedAt(limit.getUpdatedAt())
                .updatedBy(limit.getUpdatedBy())
                .build();
    }
}
