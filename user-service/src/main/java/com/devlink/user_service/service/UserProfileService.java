package com.devlink.user_service.service;

import com.devlink.user_service.dto.response.FollowRequestModeResponse;
import com.devlink.user_service.dto.response.UserProfileResponse;
import com.devlink.user_service.dto.response.UserSearchPageResponse;
import com.devlink.user_service.dto.response.VisibilitySettingResponse;
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

    /**
     * Search users by name, city, and address with optional friend/follower/following filters.
     *
     * @param name           the keyword to match against full names
     * @param city           optional city keyword
     * @param address        optional address keyword
     * @param friendsOnly    filter to search only friends
     * @param followersOnly  filter to search only followers
     * @param followingOnly  filter to search only following
     * @param page           page number (0-indexed)
     * @param size           page size
     * @return UserSearchPageResponse containing page of matched user profiles
     */
    UserSearchPageResponse search(
            String name,
            String city,
            String address,
            Boolean friendsOnly,
            Boolean followersOnly,
            Boolean followingOnly,
            int page,
            int size
    );

    List<String> getProvinces();

}
