import axiosInstance from '../axiosInstance';
import type {UpdateProfileRequest, UserProfileResponse} from '../../types/profile.types';

export const userProfileApi = {
    getProfile: () =>
        axiosInstance.get<{data: UserProfileResponse}>('/api/users/me/profile'),

    updateProfile: (data: UpdateProfileRequest) =>
        axiosInstance.put<{data: UserProfileResponse}>('/api/users/me/profile', data),

    dismissNudge: (dismissForever: boolean) =>
        axiosInstance.patch(`/api/users/me/profile/nudge-dismiss?dismissNudge=${dismissForever}`),
};
