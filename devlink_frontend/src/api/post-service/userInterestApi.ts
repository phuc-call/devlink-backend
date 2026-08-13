import axiosInstance from '../axiosInstance';

export const userInterestApi = {
    getMyInterests(page: number = 0, size: number = 20) {
        return axiosInstance.get(`/api/posts/users/me/interests`, {
            params: { page, size }
        });
    },

    deleteMyInterest(tag: string) {
        return axiosInstance.delete(`/api/posts/users/me/interests/${encodeURIComponent(tag)}`);
    }
};
