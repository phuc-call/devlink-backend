import axiosInstance from '../axiosInstance';
import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '../../types/comment.types';
import type { ReactionRequest, ReactionResponse, ReactionTargetType } from '../../types/reaction.types';

export const reactionApi = {
    react(data: ReactionRequest): Promise<AxiosResponse<ApiResponse<ReactionResponse>>> {
        return axiosInstance.post('/api/reactions', data);
    },

    getSummary(targetId: number, targetType: ReactionTargetType): Promise<AxiosResponse<ApiResponse<ReactionResponse>>> {
        return axiosInstance.get(`/api/reactions/${targetType}/${targetId}/summary`);
    },

    getHighReact(targetId: number, targetType: ReactionTargetType): Promise<AxiosResponse<ApiResponse<string[]>>> {
        return axiosInstance.get(`/api/reactions/reactions/${targetType}/${targetId}/top`);
    }
};
