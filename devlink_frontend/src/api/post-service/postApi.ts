
import axiosInstance from '../axiosInstance';
import type { UpdatePostRequest } from '../../types/post.types';

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
};