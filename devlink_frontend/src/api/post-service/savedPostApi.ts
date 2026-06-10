import axiosInstance from '../axiosInstance';
import type { SavedPostPageResponse } from '../../types/savedPost.types';

export const savedPostApi = {
    /**
     * Lưu bài viết vào thư viện
     * POST /api/posts/saved/{postId}
     */
    savePost: (postId: number) =>
        axiosInstance.post<{ success: boolean; message: string }>(`/api/posts/saved/${postId}`),

    /**
     * Xoá bài viết khỏi thư viện
     * DELETE /api/posts/saved/{postId}
     */
    unsavePost: (postId: number) =>
        axiosInstance.delete<{ success: boolean; message: string }>(`/api/posts/saved/${postId}`),

    /**
     * Lấy danh sách bài viết đã lưu (phân trang)
     * GET /api/posts/saved?page=&size=
     */
    getSavedPosts: (page: number, size: number) =>
        axiosInstance.get<{ success: boolean; data: SavedPostPageResponse }>('/api/posts/saved', {
            params: { page, size },
        }),
};