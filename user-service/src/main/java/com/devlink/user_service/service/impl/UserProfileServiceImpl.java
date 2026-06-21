package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.reponse.*;
import com.devlink.user_service.dto.request.UpdateNudgeConfigRequest;
import com.devlink.user_service.dto.request.UpdateProfileRequest;
import com.devlink.user_service.entity.ProfileNudgeConfig;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserProfile;
import com.devlink.user_service.entity.enums.FollowStatus;
import com.devlink.user_service.entity.enums.ProfileVisibility;
import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.*;
import com.devlink.user_service.security.SecurityUtils;
import com.devlink.user_service.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cloud.client.loadbalancer.RetryLoadBalancerInterceptor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserProfileServiceImpl implements UserProfileService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProfileNudgeConfigRepository profileNudgeConfigRepository;
    private final UserBlockRepository userBlockRepository;

    private final RestTemplate restTemplate;
    private final ModelMapper modelMapper;

    private ModelMapper skipNullMapper;
    private RetryLoadBalancerInterceptor retryLoadBalancerInterceptor;

    @Autowired
    public void setSkipNullMapper(@Qualifier("skipNullMapper") ModelMapper skipNullMapper) {
        this.skipNullMapper = skipNullMapper;
    }

    private final UserHelper userHelper;
    private final FollowRepository followRepository;

    @Override
    public UserProfileResponse updateUserProfile(UpdateProfileRequest request) {
        User user = userHelper.getCurrentUser();
        UserProfile userProfile = getOrCreateProfile(user);

        if (request.getFullName() != null)
            userProfile.setFullName(request.getFullName());
        if (request.getBio() != null)
            userProfile.setBio(request.getBio());
        if (request.getSchool() != null)
            userProfile.setSchool(request.getSchool());
        if (request.getMajor() != null)
            userProfile.setMajor(request.getMajor());
        if (request.getCity() != null)
            userProfile.setCity(request.getCity());
        if (request.getCountryCode() != null)
            userProfile.setCountryCode(request.getCountryCode());
        if (request.getTimezone() != null)
            userProfile.setTimezone(request.getTimezone());
        if (request.getAddress() != null)
            userProfile.setAddress(request.getAddress());
        if (request.getFavoriteLanguage() != null && !request.getFavoriteLanguage().isEmpty()) {
            userProfile.setFavoriteLanguage(request.getFavoriteLanguage());
        }

        // total completed of profile
        ProfileNudgeConfig config = getNudgeConfig();
        int percent = calculateCompletion(userProfile, config);
        userProfile.setCompletionPercent(percent);

        if (Boolean.TRUE.equals(config.getFeatureEnabled())) {
            scheduleNudge(userProfile, percent, config);
        }
        log.info("User {} updated profile. Completion: {}%", user.getId(), percent);
        UserProfile savedProfile = userProfileRepository.save(userProfile);
        return modelMapper.map(savedProfile, UserProfileResponse.class);
    }

    @Override
    public FollowRequestModeResponse updateFollowRequestMode(Boolean followRequestMode) {
        User user = userHelper.getCurrentUser();
        user.setFollowRequestMode(followRequestMode);
        userRepository.save(user);
        return FollowRequestModeResponse.builder()
                .followRequestMode(followRequestMode)
                .pendingRequestsAccepted(0)
                .build();
    }

    // Service
    @Override
    @Transactional(readOnly = true)
    public FollowRequestModeResponse getFollowRequestMode() {
        User user = userHelper.getCurrentUser();
        return FollowRequestModeResponse.builder()
                .followRequestMode(user.getFollowRequestMode())
                .pendingRequestsAccepted(0)
                .build();
    }

    private void scheduleNudge(UserProfile userProfile, int percent, ProfileNudgeConfig profileNudgeConfig) {
        if (percent > profileNudgeConfig.getCompletionThreshold()) {
            userProfile.setNextNudgeAt(null);
            userProfile.setNudgeDismissedForever(true);
            return;
        }
        int count = userProfile.getNudgeSentCount();
        LocalDateTime now = LocalDateTime.now();
        switch (count) {
            case 0 -> userProfile.setNextNudgeAt(now.plusDays(profileNudgeConfig.getFirstNudgeDays()));
            case 1 -> userProfile.setNextNudgeAt(now.plusDays(profileNudgeConfig.getSecondNudgeDays()));
            case 2 -> userProfile.setNextNudgeAt(now.plusDays(profileNudgeConfig.getThirdNudgeDays()));
            default -> userProfile.setNudgeDismissedForever(true);
        }
    }

    private int calculateCompletion(UserProfile profile, ProfileNudgeConfig config) {
        int languageWeight = config.getLanguageWeight();
        int baseWeight = 100 - languageWeight;

        List<String> fields = List.of(
                profile.getFullName() != null ? profile.getFullName() : "",
                profile.getBio() != null ? profile.getBio() : "",
                profile.getSchool() != null ? profile.getSchool() : "",
                profile.getMajor() != null ? profile.getMajor() : "");

        double perField = baseWeight / (double) fields.size();

        double percent = 0;

        for (String field : fields) {
            if (hasValue(field))
                percent += perField;
        }
        if (hasLanguage(profile.getFavoriteLanguage())) {
            percent += languageWeight;
        }
        return (int) Math.min(percent, 100);
    }

    private boolean hasLanguage(List<ProgrammingLanguage> languages) {
        return languages != null && !languages.isEmpty();
    }

    private boolean hasValue(String value) {
        return value != null && !value.isBlank();
    }

    @Override
    public UserProfileResponse getProfile() {
        User user = userHelper.getCurrentUser();
        UserProfile profile = getOrCreateProfile(user);
        ProfileNudgeConfig config = getNudgeConfig();
        UserProfileResponse response = modelMapper.map(profile, UserProfileResponse.class);
        response.setShouldShowNudge(shouldShowNudge(profile, config));
        return response;
    }

    private boolean shouldShowNudge(UserProfile profile, ProfileNudgeConfig config) {
        if (!Boolean.TRUE.equals(config.getFeatureEnabled()))
            return false;
        if (Boolean.TRUE.equals(profile.getNudgeDismissedForever()))
            return false;
        if (profile.getCompletionPercent() >= config.getCompletionThreshold())
            return false;
        LocalDateTime nextNudge = profile.getNextNudgeAt();
        return nextNudge == null || !nextNudge.isAfter(LocalDateTime.now());
    }

    // get profile of another person
    @Override
    public UserProfileResponse getUserProfile(Long userId) {
        Long viewerId = userHelper.getCurrentUser().getId();
        User owner = userHelper.getUser(userId);
        UserProfile profile = owner.getProfile();

        if (viewerId.equals(userId)) {
            return toFullResponse(owner);
        }
        if (userBlockRepository.isBlocked(viewerId, userId)) {
            return buildLimitedResponse(profile, owner);
        }

        boolean isFollowing = followRepository.existsByFollowerIdAndFollowingId(viewerId, owner.getId());
        if (isFollowing) {
            followRepository.incrementView(viewerId, owner.getId(), LocalDateTime.now());
        }
        switch (owner.getProfileVisibility()) {
            case PUBLIC -> {
                return toFullResponse(owner);
            }
            case PROTECTED -> {
                boolean isMutual = followRepository.existsByFollowerIdAndFollowingIdAndStatus(
                        viewerId, owner.getId(), FollowStatus.ACCEPTED);

                if (!isMutual)
                    return buildLimitedResponse(owner.getProfile(), owner);

                return modelMapper.map(owner.getProfile(), UserProfileResponse.class);
            }
            case PRIVATE -> {
                return buildLimitedResponse(owner.getProfile(), owner);
            }

        }

        return toFullResponse(owner);
    }

    @Override
    @Transactional(readOnly = true)
    public VisibilitySettingResponse getVisibilitySetting() {
        User user = userHelper.getCurrentUser();
        return VisibilitySettingResponse.builder()
                .current(user.getProfileVisibility())
                .options(Arrays.asList(ProfileVisibility.values()))
                .build();
    }

    @Override
    public void updateVisibilitySetting(String visibility) {
        User user = userHelper.getCurrentUser();
        ProfileVisibility profileVisibility;
        try {
            profileVisibility = ProfileVisibility.fromString(visibility);
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.VISIBILITY_NOT_FOUND);
        }
        user.setProfileVisibility(profileVisibility);
        userRepository.save(user);
    }

    private UserProfileResponse buildLimitedResponse(UserProfile profile, User owner) {
        if (profile == null)
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        return UserProfileResponse.builder()
                .fullName(profile.getFullName())
                .userId(owner.getId())
                .avatarUrl(profile.getAvatarUrl())
                .coverImageUrl(profile.getCoverImageUrl())
                .build();
    }

    private UserProfileResponse toFullResponse(User owner) {
        UserProfileResponse res = modelMapper.map(owner.getProfile(), UserProfileResponse.class);
        res.setUserId(owner.getId());
        return res;
    }

    @Override
    public void dismissNudge(boolean dismissForever) {
        User user = userHelper.getCurrentUser();
        UserProfile userProfile = user.getProfile();
        if (userProfile == null)
            return;
        if (dismissForever) {
            userProfile.setNudgeDismissedForever(true);
            userProfile.setNextNudgeAt(null);
        } else {
            int newCount = userProfile.getNudgeSentCount() + 1;
            userProfile.setNudgeSentCount(newCount);

            ProfileNudgeConfig config = getNudgeConfig();
            if (newCount >= 3) {
                userProfile.setNudgeDismissedForever(true);
                userProfile.setNextNudgeAt(null);
            } else {
                scheduleNudge(userProfile, userProfile.getCompletionPercent(), config);
            }
        }
        log.info("User {} dismissed nudge. Dismiss forever: {}. Next nudge at: {}",
                user.getId(), dismissForever, userProfile.getNextNudgeAt());
        userProfileRepository.save(userProfile);
    }

    // ADMIN
    @Override
    public void updateNudgeConfig(UpdateNudgeConfigRequest request) {
        ProfileNudgeConfig config = getNudgeConfig();

        modelMapper.map(request, config);
        config.setUpdatedBy(SecurityUtils.getCurrentUserId());
        profileNudgeConfigRepository.save(config);
        log.info("Admin {} updated nudge config: {}", SecurityUtils.getCurrentUserId(), request);
    }

    private ProfileNudgeConfig getNudgeConfig() {
        return profileNudgeConfigRepository.findById(1L)
                .orElseGet(ProfileNudgeConfig::new);
    }

    private UserProfile getOrCreateProfile(User user) {
        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
            userProfileRepository.save(profile);
        }
        return profile;
    }

    @Autowired
    public void setRetryLoadBalancerInterceptor(RetryLoadBalancerInterceptor retryLoadBalancerInterceptor) {
        this.retryLoadBalancerInterceptor = retryLoadBalancerInterceptor;
    }

    @Override
    @Cacheable("provinces")
    public List<String> getProvinces() {
        try {
            String apiUrl = "https://provinces.open-api.vn/api/v1/p/";
            ResponseEntity<List<Map<String, Object>>> responseEntity = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    });

            List<Map<String, Object>> response = responseEntity.getBody();

            if (response == null)
                return List.of();

            return response.stream()
                    .map(p -> (String) p.get("name"))
                    .map(this::stripPrefix)
                    .toList();

        } catch (Exception e) {
            log.error("The status API call failed: {}", e.getMessage());
            return List.of();
        }
    }

    private String stripPrefix(String name) {
        if (name == null)
            return "";
        return Pattern.compile("^(Thành phố |Tỉnh )",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.CANON_EQ)
                .matcher(name).replaceAll("").trim();
    }

    @Override
    public UserSearchPageResponse search(String name, String city, String address, Boolean friendsOnly, Boolean followersOnly,
            Boolean followingOnly, int page, int size) {
        User currentUser = userHelper.getCurrentUser();
        Long currentUserId = currentUser.getId();
        Pageable pageable = PageRequest.of(page, size);

        String resolvedCity = (city != null && !city.isBlank()) ? city.trim() : null;
        String resolvedAddress = (address != null && !address.isBlank()) ? address.trim() : null;
        List<Long> filterIds = null;
        if (Boolean.TRUE.equals(friendsOnly)) {
            filterIds = followRepository.findMutualFollowingIds(currentUserId);
        } else if (Boolean.TRUE.equals(followersOnly)) {
            filterIds = followRepository.findFollowerIds(currentUserId);
        } else if (Boolean.TRUE.equals(followingOnly)) {
            filterIds = followRepository.findFollowingIds(currentUserId);
        }

        boolean userFilter = filterIds != null;
        List<Long> safeIds = (filterIds != null && !filterIds.isEmpty()) ? filterIds : List.of(-1L);
        Page<UserSearchResponse> users = followRepository.search(
                name.trim(), resolvedCity, resolvedAddress, userFilter, safeIds, currentUserId, pageable);
        return UserSearchPageResponse.builder()
                .users(users)
                .build();
    }

}
