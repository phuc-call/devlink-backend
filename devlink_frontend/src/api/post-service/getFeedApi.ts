
import axiosInstance from '../axiosInstance';
import type { FeedPostResponse, PageResponse } from '../../types/post.types';

export const getFeedApi = {
    getFeed: (page: number = 0, size: number = 3, postType?: string) => {
        const params: Record<string, string | number> = { page, size };
        if (postType) params.postType = postType;
        return axiosInstance.get<{ data: PageResponse<FeedPostResponse> }>(
            '/api/posts/feed',
            { params }
        );
    },

    getFollowingFeed: (page: number = 0, size: number = 4) => {
        return axiosInstance.get<{ data: PageResponse<FeedPostResponse> }>(
            '/api/posts/following',
            { params: { page, size } }
        );
    },

    getGroupPosts: (groupId: number, page: number = 0, size: number = 10) => {
        return axiosInstance.get<{ data: PageResponse<FeedPostResponse> }>(
            `/api/posts/groups/${groupId}`,
            { params: { page, size } }
        );
    },
};