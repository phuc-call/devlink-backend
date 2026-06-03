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

// 1. Lấy chi tiết Fork (Sửa lại trả về res.data)
export const getForkDetail = async (forkId: number): Promise<ForkDetailResponse> => {
    const res = await axiosInstance.get(`/api/templates/forks/${forkId}`);
    return res.data; // Đã fix xong tầng dữ liệu
};

// 2. Cập nhật bản Fork (Đổi từ .put sang .patch cho đúng Swagger)
export const updateFork = async (forkId: number, data: UpdateForkRequest): Promise<ForkDetailResponse> => {
    const res = await axiosInstance.patch(`/api/templates/forks/${forkId}`, data);
    return res.data.data;
};

// 3. Reset bản Fork (Đổi từ .post sang .put cho đúng Swagger)
export const resetFork = async (forkId: number): Promise<ForkDetailResponse> => {
    const res = await axiosInstance.put(`/api/templates/forks/${forkId}/reset`);
    return res.data.data;
};

export interface ForkResponse {
    forkId: number;
    templateId: number;
    title: string;
    isModified: boolean;
}

// 4. Lấy danh sách Fork (Giữ nguyên vì Backend bọc ApiResponse)
export const getMyForks = async (): Promise<ForkResponse[]> => {
    const res = await axiosInstance.get('/api/templates/forks/user/forks');
    return res.data.data;
};