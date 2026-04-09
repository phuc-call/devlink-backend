package com.devlink.user_service.service;

import com.devlink.user_service.dto.request.UpdateProfileRequest;

public interface UserProfileService {
    UpdateProfileRequest updateUserProfile (UpdateProfileRequest request);
}
