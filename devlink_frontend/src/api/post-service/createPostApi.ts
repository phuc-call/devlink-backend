// src/api/post-service/createPostApi.ts
import axiosInstance from '../axiosInstance';
import type { CreatePostRequest, PostResponse } from '../../types/post.types';

export const createPostApi = {
    // POST /api/posts — multipart/form-data
    // Backend: PostController.createPost(@ModelAttribute CreatePostRequest)
    createPost: (request: CreatePostRequest) => {
        const formData = new FormData();

        if (request.content !== undefined) {
            formData.append('content', request.content);
        }

        if (request.visibility !== undefined) {
            formData.append('visibility', request.visibility);
        }

        if (request.postType !== undefined) {
            formData.append('postType', request.postType);
        }

        if (request.groupId !== undefined) {
            formData.append('groupId', request.groupId.toString());
        }

        // tags là List<String> trong backend — append từng phần tử riêng
        if (request.tags && request.tags.length > 0) {
            request.tags.forEach((tag) => {
                formData.append('tags', tag);
            });
        }

        // mediaFiles là List<MultipartFile> — append từng file riêng
        if (request.mediaFiles && request.mediaFiles.length > 0) {
            request.mediaFiles.forEach((file) => {
                formData.append('mediaFiles', file);
            });
        }

        return axiosInstance.post<{ data: PostResponse; message: string }>(
            '/api/posts',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
    },
};