
import axiosInstance from '../axiosInstance';
import type { FeedPostResponse, PageResponse } from '../../types/post.types';

export const getFeedApi = {
    getFeed: (page: number = 0, size: number = 20, postType?: string) => {
        const params: Record<string, string | number> = { page, size };
        if (postType) params.postType = postType;
        return axiosInstance.get<{ data: PageResponse<FeedPostResponse> }>(
            '/api/posts/feed',
            { params }
        );
    },
};