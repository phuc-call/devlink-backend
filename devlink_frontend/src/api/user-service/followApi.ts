import axiosInstance from '../axiosInstance';
import type {BlockStatusResponse, PageResponse} from '../../types/common.types';
import type { UserFollowingCardResponse } from '../../types/follow.types';

export type FollowActionResult = 'FOLLOWING' | 'FRIEND' | 'NOT_FOLLOWING';

export interface FollowResponse {
    userId: number;
    fullName: string;
    avatar?: string;
    status: string;
}

export const followApi = {

    getFollowStatus: (userId: number) =>
        axiosInstance.get<{ data: FollowActionResult }>(`/api/users/${userId}/follow`),


    followUser: (userId: number) =>
        axiosInstance.post<{ data: null }>(`/api/users/${userId}/follow`),


    unFollowUser: (userId: number) =>
        axiosInstance.delete<{ data: null }>(`/api/users/${userId}/follow`),


    cancelFollowRequest: (userId: number) =>
        axiosInstance.delete<{ data: null }>(`/api/users/${userId}/follow/cancel`),


    getFollowers: (page = 0, size = 20) =>
        axiosInstance.get<{ data: PageResponse<FollowResponse> }>('/api/users/me/followers', {
            params: { page, size },
        }),



    // GET /api/users/me/following
    getFollowing: (page = 0, size = 20) =>
        axiosInstance.get<{ data: PageResponse<FollowResponse> }>('/api/users/me/following', {
            params: { page, size },
        }),
 // GET /api/users/me/following/cards
    getFollowingCards: (page = 0, size = 20) =>
        axiosInstance.get<{ data: PageResponse<UserFollowingCardResponse> }>('/api/users/me/following/cards', {
            params: { page, size },
        }),
    // POST /api/users/{userId}/view
    incrementViewCount: (userId: number) =>
        axiosInstance.post<{ data: null }>(`/api/users/${userId}/view`),

    // POST /api/users/me/block/{userId}
    blockUser: (userId: number) =>
        axiosInstance.post<{ data: BlockStatusResponse }>(`/api/users/${userId}/block`),


    // DELETE /api/users/me/block/{userId}
    getBlockStatus: (userId: number) =>
        axiosInstance.get<{ data: BlockStatusResponse }>(`/api/users/${userId}/block-status`),

};