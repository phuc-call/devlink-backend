import axiosInstance from '../axiosInstance';

export interface ChatUserResponse {
    id: number;
    fullName: string;
    avatarUrl: string;
}

export const chatUserApi = {
    getOrSyncUser: (userId: number) => {
        return axiosInstance.get<{ success: boolean; data: ChatUserResponse }>(`/api/chat/users/${userId}`);
    },
};
