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
 */
export const getTemplateMetaOptions = async (): Promise<TemplateMetaOptions> => {
    const res = await axiosInstance.get('/api/templates');
    return res.data.data;
};

/**
 * Lấy danh sách ngôn ngữ lập trình được hỗ trợ
 */
export const getSupportedLanguages = async (): Promise<LanguageOptions> => {
    const res = await axiosInstance.get('/internal/users/languages');
    return res.data.data;
};

/**
 * [ADMIN] Tạo learning template mới
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

    const res = await axiosInstance.post('/api/templates/admin', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
    });
    return res.data.data;
};

/**
 * Lấy danh sách template của tôi
 */
export const getMyTemplates = async (
    params: GetMyTemplatesParams = {},
): Promise<MyTemplateListResponse> => {
    const res = await axiosInstance.get('/api/templates/me', {params});
    return res.data.data;
};

/**
 * Lấy danh sách template cho Admin
 */
export const getAdminTemplates = async (
    params: GetAdminTemplatesParams = {},
): Promise<AdminTemplateListResponse> => {
    const res = await axiosInstance.get('/api/templates/admin', { params });
    return res.data.data;
};

/**
 * Lấy chi tiết một template
 */
export const getTemplateDetail = async (id: number): Promise<TemplateDetailResponse> => {
    const res = await axiosInstance.get(`/api/templates/${id}`);
    return res.data.data;
};

/**
 * Hành động Fork Template
 */
export const forkTemplate = async (templateId: number): Promise<ForkResponse> => {
    const res = await axiosInstance.post(`/api/templates/${templateId}/fork`);
    return res.data.data;
};