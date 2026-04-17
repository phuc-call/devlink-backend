package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.FollowRequestModeResponse;
import com.devlink.user_service.dto.reponse.UserProfileResponse;
import com.devlink.user_service.dto.request.ClearProfileFieldsRequest;
import com.devlink.user_service.dto.request.UpdateNudgeConfigRequest;
import com.devlink.user_service.dto.request.UpdateProfileRequest;

public interface UserProfileService {
    public UserProfileResponse updateUserProfile(UpdateProfileRequest request);

    void clearProfileFields(ClearProfileFieldsRequest request);
    UserProfileResponse getProfile();
    public void updateNudgeConfig(UpdateNudgeConfigRequest request);
    public void dismissNudge(boolean dismissForever);
    FollowRequestModeResponse updateFollowRequestMode(Boolean followRequestMode);
    public UserProfileResponse getUserProfile(Long userId);
}
