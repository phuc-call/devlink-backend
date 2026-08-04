
import axiosInstance from '../axiosInstance';
import type { UpdatePostRequest, FeedPostResponse, PageResponse, MediaResponse } from '../../types/post.types';

export const postApi = {
    updatePost: (id: number, data: UpdatePostRequest) => {
        const formData = new FormData();

        if (data.content !== undefined) formData.append('content', data.content);
        if (data.visibility) formData.append('visibility', data.visibility);
        if (data.tags) {
            data.tags.forEach(tag => formData.append('tags', tag));
        }
        if (data.removeMediaIds) {
            data.removeMediaIds.forEach(id => formData.append('removeMediaIds', String(id)));
        }
        if (data.newMediaFiles) {
            data.newMediaFiles.forEach(file => formData.append('newMediaFiles', file));
        }

        return axiosInstance.put(`/api/posts/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    deletePost: (id: number) => {
        return axiosInstance.delete(`/api/posts/${id}`);
    },

    getUserPosts: (userId: number, page: number = 0, size: number = 10) => {
        return axiosInstance.get<{ data: PageResponse<FeedPostResponse> }>(
            `/api/posts/users/${userId}`,
            { params: { page, size } }
        );
    },

    getPostById: (id: number) => {
        return axiosInstance.get<{ data: FeedPostResponse }>(`/api/posts/${id}`);
    },

    sharePost: (id: number, content?: string) => {
        return axiosInstance.post<{ data: FeedPostResponse }>(
            `/api/posts/${id}/share`,
            null,
            { params: { content } }
        );
    },

    getPostsByTag: (tag: string, page: number = 0, size: number = 10) => {
        return axiosInstance.get<{ data: PageResponse<FeedPostResponse> }>(
            `/api/posts/tags`,
            { params: { tag, page, size } }
        );
    },

    getImages: (userId: number | null, page: number = 0, size: number = 10) => {
        return axiosInstance.get<PageResponse<string>>(
            `/api/posts/images`,
            { params: { userId, page, size } }
        );
    },

    getImagesDetails: (userId: number | null, page: number = 0, size: number = 10) => {
        return axiosInstance.get<PageResponse<MediaResponse>>(
            `/api/posts/images/details`,
            { params: { userId, page, size } }
        );
    },

    getImageDetail: (imageId: number, userId?: number | null) => {
        return axiosInstance.get<{ data: MediaResponse }>(
            `/api/posts/images/${imageId}`,
            { params: { userId } }
        );
    },
};