import axiosInstance from '../axiosInstance';
import type {
    ApiResponse,
    CommentResponse,
    CommentSummaryResponse,
    CommentReplyResponse,
    CommentReplySummaryResponse,
    CreateCommentRequest,
    CreateCommentReplyRequest,
    UpdateCommentRequest,
    SpringPage,
} from '../../types/comment.types';
import type { AxiosResponse } from 'axios';

export type CommentType = 'COMMENT' | 'REPLY';

export const commentApi = {
    // ── Comment ──
    getComments(
        postId: number,
        page: number = 0,
    ): Promise<AxiosResponse<ApiResponse<SpringPage<CommentSummaryResponse>>>> {
        return axiosInstance.get('/api/posts/comments', {
            params: { postId, page },
        });
    },

    createComment(
        data: CreateCommentRequest,
    ): Promise<AxiosResponse<ApiResponse<CommentResponse>>> {
        return axiosInstance.post('/api/posts/comments', data);
    },

    deleteComment(
        id: number,
        type: CommentType,
    ): Promise<AxiosResponse<ApiResponse<void>>> {
        return axiosInstance.delete(`/api/posts/comments/${id}`, {
            params: { type },
        });
    },

    updateComment(
        id: number,
        data: UpdateCommentRequest,
    ): Promise<AxiosResponse<ApiResponse<CommentResponse>>> {
        return axiosInstance.put(`/api/posts/comments/${id}`, data);
    },

    // ── Reply ──
    createReply(
        data: CreateCommentReplyRequest,
    ): Promise<AxiosResponse<ApiResponse<CommentReplyResponse>>> {
        return axiosInstance.post('/api/posts/comments/replies', data);
    },

    getReplies(
        commentId: number,
        page: number = 0,
    ): Promise<AxiosResponse<ApiResponse<SpringPage<CommentReplySummaryResponse>>>> {
        return axiosInstance.get('/api/posts/comments/replies', {
            params: { commentId, page },
        });
    },
};