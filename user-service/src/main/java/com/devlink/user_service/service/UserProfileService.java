package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.FollowRequestModeResponse;
import com.devlink.user_service.dto.reponse.UserProfileResponse;
import com.devlink.user_service.dto.reponse.UserSearchPageResponse;
import com.devlink.user_service.dto.reponse.VisibilitySettingResponse;
import com.devlink.user_service.dto.request.UpdateNudgeConfigRequest;
import com.devlink.user_service.dto.request.UpdateProfileRequest;

import java.util.List;

public interface UserProfileService {
    UserProfileResponse updateUserProfile(UpdateProfileRequest request);

    UserProfileResponse getProfile();

    void updateNudgeConfig(UpdateNudgeConfigRequest request);

    void dismissNudge(boolean dismissForever);

    FollowRequestModeResponse updateFollowRequestMode(Boolean followRequestMode);

    UserProfileResponse getUserProfile(Long userId);

    VisibilitySettingResponse getVisibilitySetting();

    void updateVisibilitySetting(String visibility);

    FollowRequestModeResponse getFollowRequestMode();

    UserSearchPageResponse search(
            String name,
            String city,
            Boolean friendsOnly,
            Boolean followersOnly,
            Boolean followingOnly,
            int page,
            int size
    );

    List<String> getProvinces();
}
