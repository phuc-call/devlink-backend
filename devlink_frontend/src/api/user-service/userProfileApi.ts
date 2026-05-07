import axiosInstance from '../axiosInstance';
import type {
    UpdateProfileRequest,
    UserProfileResponse,
    UserRecommendationResponse,
    VisibilitySettingResponse
} from '../../types/profile.types';


export const userProfileApi = {
    getProfile: () =>
        axiosInstance.get<{data: UserProfileResponse & {shouldShowNudge: boolean}}>('/api/users/me/profile'),

    updateProfile: (data: UpdateProfileRequest) =>
        axiosInstance.put<{data: UserProfileResponse}>('/api/users/me/profile', data),

    dismissNudge: (dismissForever: boolean) =>
        axiosInstance.patch(`/api/users/me/profile/nudge-dismiss?dismissNudge=${dismissForever}`),

    getNormalRecommendations: () =>
        axiosInstance.get<{data: UserRecommendationResponse[]}>('/api/users/me/normal/recommendation'),

    getSpecialRecommendations: () =>
        axiosInstance.get<{data: UserRecommendationResponse[]}>('/api/users/me/special/recommendation'),


    getVisibilitySetting: () =>
        axiosInstance.get<{data: VisibilitySettingResponse}>('/api/users/me/visibility-setting'),

    updateVisibilitySetting: (visibility: string) =>
        axiosInstance.patch(`/api/users/me/visibility-setting?visibility=${visibility}`),

    updateFollowRequestMode: (enabled: boolean) =>
        axiosInstance.patch(`/api/users/me/follow-request-mode?enabled=${enabled}`),
    getFollowRequestMode: () =>
        axiosInstance.get<{data: {followRequestMode: boolean}}>('/api/users/me/follow-request-mode'),

    getUserProfile: (userId: number) =>
        axiosInstance.get<{data: UserProfileResponse}>(`/api/users/profiles/${userId}`),
};