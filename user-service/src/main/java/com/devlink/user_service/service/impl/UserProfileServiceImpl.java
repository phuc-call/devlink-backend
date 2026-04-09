package com.devlink.user_service.service.impl;

import com.devlink.user_service.dto.request.UpdateProfileRequest;
import com.devlink.user_service.entity.ProfileNudgeConfig;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserProfile;
import com.devlink.user_service.repository.ProfileNudgeConfigRepository;
import com.devlink.user_service.repository.UserProfileRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.UserProfileService;
import com.devlink.user_service.util.SecurityUtil;
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

    @Override
    public UpdateProfileRequest updateUserProfile(UpdateProfileRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow(() ->
                new RuntimeException("User not found with id: " + userId));
        UserProfile userProfile = user.getProfile();
        if (userProfile == null) {
            userProfile = new UserProfile();
            userProfile.setUser(user);
            userProfileRepository.save(userProfile);
        }
        modelMapper.map(request, userProfile);
        //total completed of profile
        ProfileNudgeConfig config = profileNudgeConfigRepository.findById(1L).
                orElseGet(ProfileNudgeConfig::new);
        int percent = calculateCompletion(userProfile, config);
        userProfile.setCompletionPercent(percent);

        if (config.getFeatureEnabled()) {
            sche
        }
    }

    private void scheduleNudge(UserProfile userProfile, int percent, ProfileNudgeConfig profileNudgeConfig) {
        if (percent > profileNudgeConfig.getCompletionThreshold()) {
            userProfile.setNextNudgeAt(null);
            return;
        }
        int count = userProfile.getNudgeSentCount();
        LocalDateTime now = LocalDateTime.now();
        switch (count){
            case 0 -> userProfile.setNextNudgeAt(now.plus(profileNudgeConfig.getFirstNudgeDe));
            case 1 -> userProfile.setNextNudgeAt(now.plus(profileNudgeConfig.g
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
}
