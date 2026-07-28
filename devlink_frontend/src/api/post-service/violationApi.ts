// src/api/post-service/violationApi.ts

import axiosInstance from '../axiosInstance';
import type {
    ViolationOverviewResponse,
    ViolationPageResponse,
    ViolationHistoryResponse,
    PenaltyConfigResponse,
    UpdatePenaltyConfigRequest,
} from '../../types/violation.types';

const BASE = '/api/posts/violations/admin';

export const violationApi = {

    getOverview() {
        return axiosInstance.get<{ data: ViolationOverviewResponse }>(`${BASE}/overview`);
    },

    getHistories(violatorId?: number, page = 0, size = 20) {
        return axiosInstance.get<{ data: ViolationPageResponse }>(`${BASE}/histories`, {
            params: { ...(violatorId !== undefined ? { violatorId } : {}), page, size },
        });
    },

    getHistoryById(id: number) {
        return axiosInstance.get<{ data: ViolationHistoryResponse }>(`${BASE}/histories/${id}`);
    },

    getByUser(userId: number) {
        return axiosInstance.get<{ data: ViolationHistoryResponse[] }>(`${BASE}/user/${userId}`);
    },

    getPenaltyConfigs() {
        return axiosInstance.get<{ data: PenaltyConfigResponse[] }>(`${BASE}/penalty-configs`);
    },

    updatePenaltyConfig(configId: number, req: UpdatePenaltyConfigRequest) {
        return axiosInstance.put<{ data: PenaltyConfigResponse }>(
            `${BASE}/penalty-configs/${configId}`,
            req
        );
    },

    updateAdminNote(reportId: number, adminNote: string) {
        return axiosInstance.patch<{ data: null }>(
            `/api/posts/violations/admin/reporter-details/${reportId}/note`,
            { adminNote }
        );
    },
};
