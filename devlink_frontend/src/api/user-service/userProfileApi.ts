import axiosInstance from '../axiosInstance';
import type {UpdateProfileRequest, UserProfileResponse,UserRecommendationResponse} from '../../types/profile.types';


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
};