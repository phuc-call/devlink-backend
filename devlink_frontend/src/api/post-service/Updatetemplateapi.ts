import axiosInstance from '../axiosInstance';
import type { UpdateTemplatePayload, UpdateTemplateResponse } from '../../types/updateTemplate.types';
import type { ApiResponse } from '../../types/template.types';

/**
 * [ADMIN] Cập nhật learning template
 * PATCH /api/templates/admin/{templateId}
 * Content-Type: multipart/form-data  (@ModelAttribute + optional @RequestPart file)
 */
export const updateAdminTemplate = async ({
                                              templateId,
                                              request,
                                              file,
                                          }: UpdateTemplatePayload): Promise<UpdateTemplateResponse> => {
    const formData = new FormData();

    formData.append('title', request.title);

    if (request.description?.trim()) {
        formData.append('description', request.description.trim());
    }

    formData.append('language', request.language.toUpperCase().trim());
    formData.append('difficulty', request.difficulty);
    formData.append('fileType', request.fileType);

    request.tags?.forEach((tag) => formData.append('tags', tag));
    request.topics?.forEach((topic) => formData.append('topics', topic));

    // file là optional — chỉ append khi người dùng chọn file mới
    if (file) {
        formData.append('file', file);
    }

    const res = await axiosInstance.patch<ApiResponse<UpdateTemplateResponse>>(
        `/api/templates/admin/${templateId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    const body = res.data;

    if (!body.success) {
        throw new Error(body.message ?? 'Cập nhật thất bại');
    }

    return body.data;
};
