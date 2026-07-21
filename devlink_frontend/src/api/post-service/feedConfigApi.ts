import axiosInstance from '../axiosInstance';

export interface FeedScoringConfigResponse {
    id: number;
    configKey: string;
    configValue: number;
    description: string;
    updatedAt: string;
    updatedBy: number | null;
}

export interface FeedScoringConfigRequest {
    configKey: string;
    configValue: number;
}

export const feedConfigApi = {
    getAll: () =>
        axiosInstance.get<{ data: FeedScoringConfigResponse[] }>('/post-service/api/admin/feed-config'),

    update: (request: FeedScoringConfigRequest) =>
        axiosInstance.put<{ data: FeedScoringConfigResponse }>('/post-service/api/admin/feed-config', request),
};
