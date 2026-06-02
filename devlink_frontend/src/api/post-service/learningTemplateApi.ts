import axiosInstance from '../axiosInstance';
import type {
    CreateTemplateRequest,
    LanguageOptions,
    TemplateMetaOptions,
    TemplateResponse,
    MyTemplateListResponse,
    GetMyTemplatesParams,
    AdminTemplateListResponse,
    GetAdminTemplatesParams,
    TemplateDetailResponse
} from '../../types/template.types';

import type {
    ForkResponse
} from '../../types/fork.types';


/**
 * [ADMIN] Lấy danh sách difficulty + fileType
 * GET /api/posts/admin
 */
export const getTemplateMetaOptions = async (): Promise<TemplateMetaOptions> => {
    const res = await axiosInstance.get('/api/posts');
    return res.data.data;
};

/**
 * Lấy danh sách ngôn ngữ lập trình được hỗ trợ
 * GET /internal/users/languages
 */
export const getSupportedLanguages = async (): Promise<LanguageOptions> => {
    const res = await axiosInstance.get('/internal/users/languages');
    return res.data.data;
};

/**
 * [ADMIN] Tạo learning template mới
 * POST /api/posts/admin — multipart/form-data + @ModelAttribute
 *
 * Backend dùng @ModelAttribute nên PHẢI append từng field riêng,
 * KHÔNG được JSON.stringify cả object vào một blob
 */
export const adminCreateTemplate = async (
    request: CreateTemplateRequest,
    file: File,
): Promise<TemplateResponse> => {
    const formData = new FormData();

    formData.append('title', request.title);
    if (request.description) formData.append('description', request.description);
    formData.append('language', request.language);
    formData.append('difficulty', request.difficulty);
    formData.append('fileType', request.fileType);

    request.tags?.forEach((tag) => formData.append('tags', tag));
    request.topics?.forEach((topic) => formData.append('topics', topic));

    formData.append('file', file);

    const res = await axiosInstance.post('/api/posts/admin', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
    });
    return res.data.data;
};

export const getMyTemplates = async (
    params: GetMyTemplatesParams = {},
): Promise<MyTemplateListResponse> => {
    const res = await axiosInstance.get('/api/posts/me', {params});
    return res.data.data;
};

export const getAdminTemplates = async (
    params: GetAdminTemplatesParams = {},
): Promise<AdminTemplateListResponse> => {
    const res = await axiosInstance.get('/api/posts/admin/template', { params });
    return res.data.data;
};

export const getTemplateDetail = async (id: number): Promise<TemplateDetailResponse> => {
    const res = await axiosInstance.get(`/api/posts/template/${id}`);
    return res.data.data;
};


export const forkTemplate = async (templateId: number): Promise<ForkResponse> => {
    const res = await axiosInstance.post(`/api/posts/${templateId}/fork`);
    return res.data.data;
};