import axiosInstance from '../axiosInstance';

export interface ReactHistoryResponse {
    reactId: number;
    createdAt: string;
    postId: number;
    postContent: string;
    authorId: number;
    authorName: string;
    authorAvatarUrl: string;
    reactionType: string;
    groupId: number | null;
    groupName: string | null;
    groupImage: string | null;
    files: { postId: number; url: string }[];
}

export interface CommentReplyNotificationResponse {
    replyId: number;
    replyContent: string;
    repliedAt: string;
    replierId: number;
    replierName: string;
    replierAvatarUrl: string;
    commentId: number;
    commentContent: string;
    postId: number;
    postContent: string;
    groupId: number | null;
    groupName: string | null;
    groupImage: string | null;
    files: { postId: number; url: string }[];
}

export interface PageResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    size: number;
    number: number;
    numberOfElements: number;
    first: boolean;
    empty: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export const overviewPostApi = {
    getReactHistory: (page: number = 0, size: number = 10) => {
        return axiosInstance.get<ApiResponse<PageResponse<ReactHistoryResponse>>>('/api/posts/overview/react-history', {
            params: { page, size }
        });
    },

    getCommentReplyHistory: (page: number = 0, size: number = 10) => {
        return axiosInstance.get<ApiResponse<PageResponse<CommentReplyNotificationResponse>>>('/api/posts/overview/comment-reply-history', {
            params: { page, size }
        });
    }
};
