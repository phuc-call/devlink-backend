import axiosInstance from '../axiosInstance';

export interface ReactHistoryResponse {
    reactId: number;
    createdAt: string;
    postId: number;
    postContent: string;
    authorId: number;
    reactionType: string;
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
            params: {
                page,
                size
            }
        });
    }
};
