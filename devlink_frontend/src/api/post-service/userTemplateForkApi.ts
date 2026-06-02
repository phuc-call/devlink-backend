import axiosInstance from '../axiosInstance';

export interface ForkDetailResponse {
    id: number;
    templateId: number;
    title: string;
    content: string | null;
    fileUrl: string | null;
    isModified: boolean;
    lastEditedAt: string | null;
    createdAt: string;
}

export interface UpdateForkRequest {
    content?: string;
    title?: string;
}

// 3.3 — Lấy chi tiết fork của user theo forkId
export const getForkDetail = async (forkId: number): Promise<ForkDetailResponse> => {
    const res = await axiosInstance.get(`/api/posts/forks/${forkId}`);
    return res.data.data;
};
// 3.5 — Chỉnh sửa nội dung fork
export const updateFork = async (forkId: number, data: UpdateForkRequest): Promise<ForkDetailResponse> => {
    const res = await axiosInstance.put(`/api/posts/forks/${forkId}`, data);
    return res.data.data;
};

// 3.6 — Reset fork về nội dung gốc
export const resetFork = async (forkId: number): Promise<ForkDetailResponse> => {
    const res = await axiosInstance.post(`/api/posts/forks/${forkId}/reset`);
    return res.data.data;
};
export interface ForkResponse {
    forkId: number;
    templateId: number;
    title: string;
    isModified: boolean;
}

// Lấy danh sách tất cả fork của current user
export const getMyForks = async (): Promise<ForkResponse[]> => {
    const res = await axiosInstance.get('/api/posts/forks/user/forks');
    return res.data.data;
};