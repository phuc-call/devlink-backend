package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.reponse.FollowRequestModeResponse;
import com.devlink.user_service.dto.reponse.UserProfileResponse;
import com.devlink.user_service.dto.request.ClearProfileFieldsRequest;
import com.devlink.user_service.dto.request.UpdateNudgeConfigRequest;
import com.devlink.user_service.dto.request.UpdateProfileRequest;
import com.devlink.user_service.entity.ProfileNudgeConfig;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserProfile;
import com.devlink.user_service.entity.enums.ProfileField;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.ProfileNudgeConfigRepository;
import com.devlink.user_service.repository.UserProfileRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.security.SecurityUtils;
import com.devlink.user_service.service.UserProfileService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserProfileServiceImpl implements UserProfileService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProfileNudgeConfigRepository profileNudgeConfigRepository;
    private final ModelMapper modelMapper;
    private final UserHelper userHelper;
    private final FollowRepository followRepository;


    @Override
    public UserProfileResponse updateUserProfile(UpdateProfileRequest request) {
        User user = userHelper.getCurrentUser();
        UserProfile userProfile = getOrCreateProfile(user);
        modelMapper.map(request, userProfile);
        //total completed of profile
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
        int pendingRequestsAccepted = 0;
        if (Boolean.FALSE.equals(followRequestMode)) {
            pendingRequestsAccepted = followRepository.acceptFollowRequest(user.getId());
        }
        user.setFollowRequestMode(followRequestMode);
        userRepository.save(user);
        return FollowRequestModeResponse.builder()
                .followRequestMode(followRequestMode)
                .pendingRequestsAccepted(pendingRequestsAccepted)
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
                profile.getFullName(),
                profile.getBio(),
                profile.getSchool(),
                profile.getMajor()
        );

        double perField = baseWeight / (double) fields.size();

        double percent = 0;

        for (String field : fields) {
            if (hasValue(field)) percent += perField;
        }
        if (hasLanguage(profile.getFavoriteLanguage())) {
            percent += languageWeight;
        }
        return (int) Math.min(percent, 100);
    }

    private boolean hasLanguage(List<?> list) {
        return list != null && !list.isEmpty();
    }

    private boolean hasValue(String value) {
        return value != null && !value.isBlank();
    }

    @Override
    public void clearProfileFields(ClearProfileFieldsRequest request) {
        User user = userHelper.getCurrentUser();
        UserProfile profile = user.getProfile();
        if (profile == null) return;
        for (ProfileField field : request.getProfileFields()) {
            switch (field) {
                case BIO -> profile.setBio(null);
                case FULL_NAME -> profile.setFullName(null);
                case SCHOOL -> profile.setSchool(null);
                case MAJOR -> profile.setMajor(null);
                case FAVORITE_LANGUAGE -> profile.setFavoriteLanguage(null);
            }
        }
        ProfileNudgeConfig profileNudgeConfig = getNudgeConfig();
        profile.setCompletionPercent(calculateCompletion(profile, profileNudgeConfig));
        profile.setLastProfileUpdatedAt(LocalDateTime.now());
        log.info("User {} cleared profile fields: {}. New completion: {}%",
                user.getId(), request.getProfileFields(), profile.getCompletionPercent());
        userProfileRepository.save(profile);
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
        if (!Boolean.TRUE.equals(config.getFeatureEnabled())) return false;
        if (Boolean.TRUE.equals(profile.getNudgeDismissedForever())) return false;
        if (profile.getCompletionPercent() >= config.getCompletionThreshold()) return false;
        LocalDateTime nextNudge = profile.getNextNudgeAt();
        return nextNudge == null || !nextNudge.isAfter(LocalDateTime.now());
    }

    //get profile of another person
    @Override
    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_FOUND)
        );
        UserProfile profile = user.getProfile();
        if (profile == null)
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        return modelMapper.map(profile, UserProfileResponse.class);
    }


    @Override
    public void dismissNudge(boolean dismissForever) {
        User user = userHelper.getCurrentUser();
        UserProfile userProfile = user.getProfile();
        if (userProfile == null) return;
        if (dismissForever) {
            userProfile.setNudgeDismissedForever(true);
            userProfile.setNextNudgeAt(null);
        } else {
            int newCount= userProfile.getNudgeSentCount() + 1;
            userProfile.setNudgeSentCount(newCount);

            ProfileNudgeConfig config = getNudgeConfig();
            if(newCount >= 3){
                userProfile.setNudgeDismissedForever(true);
                userProfile.setNextNudgeAt(null);
            }else {
                scheduleNudge(userProfile, userProfile.getCompletionPercent(), config);
            }
        }
        log.info("User {} dismissed nudge. Dismiss forever: {}. Next nudge at: {}",
                user.getId(), dismissForever, userProfile.getNextNudgeAt());
        userProfileRepository.save(userProfile);
    }

    //ADMIN
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
}
