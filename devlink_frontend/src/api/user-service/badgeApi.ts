
import axiosInstance from '../axiosInstance';
import type {
    BadgeConfigResponse,
    BadgeVideoLimitResponse,
    BadgeGrantResponse,
    BadgeStatsResponse,
    UserBadgeDetailResponse,
    UserSummaryResponse,
    CreateBadgeConfigRequest,
    UpdateBadgeVideoLimitRequest,
    GrantRedTickBatchRequest,
    PageResponse,
    BadgeType,
} from '../../types/badge.types';

const BASE = '/api/users';

export const badgeApi = {



    /** GET /api/users/badges/configs — Tất cả badge config */
    getAllBadgeConfigs() {
        return axiosInstance.get<{ data: BadgeConfigResponse[] }>(`${BASE}/badges/configs`);
    },

    /** GET /api/users/badges/configs/active — Config đang active */
    getActiveBadgeConfig() {
        return axiosInstance.get<{ data: BadgeConfigResponse }>(`${BASE}/badges/configs/active`);
    },

    /** GET /api/users/badges/video-limits — Tất cả video limit theo badge */
    getAllBadgeVideoLimits() {
        return axiosInstance.get<{ data: BadgeVideoLimitResponse[] }>(`${BASE}/badges/video-limits`);
    },

    /** POST /api/users/badges/{userId}/evaluate — Evaluate badge của 1 user */
    evaluateUser(userId: number) {
        return axiosInstance.post<{ data: null }>(`${BASE}/badges/${userId}/evaluate`);
    },



    /** POST /api/users/admin/badges/configs — Tạo badge config mới */
    createBadgeConfig(req: CreateBadgeConfigRequest) {
        return axiosInstance.post<{ data: BadgeConfigResponse }>(`${BASE}/admin/badges/configs`, req);
    },

    /** PUT /api/users/admin/badges/configs/{id} — Cập nhật badge config */
    updateBadgeConfig(id: number, req: CreateBadgeConfigRequest) {
        return axiosInstance.put<{ data: BadgeConfigResponse }>(`${BASE}/admin/badges/configs/${id}`, req);
    },

    /** PUT /api/users/admin/badges/video-limits/{badgeType} — Cập nhật video limit */
    updateBadgeVideoLimit(badgeType: string, req: UpdateBadgeVideoLimitRequest) {
        return axiosInstance.put<{ data: BadgeVideoLimitResponse }>(
            `${BASE}/admin/badges/video-limits/${badgeType}`,
            req
        );
    },

    /** POST /api/users/admin/badges/red-tick/{userId} — Cấp Red Tick cho 1 user */
    grantRedTick(userId: number, reason?: string) {
        return axiosInstance.post<{ data: BadgeGrantResponse }>(
            `${BASE}/admin/badges/red-tick/${userId}`,
            null,
            { params: reason ? { reason } : {} }
        );
    },


    grantRedTickBatch(req: GrantRedTickBatchRequest) {
        return axiosInstance.post<{ data: BadgeGrantResponse[] }>(
            `${BASE}/admin/badges/red-tick/batch`,
            req
        );
    },

    /** GET /api/users/admin/users/search?keyword=&page=&size= */
    searchUsers(keyword: string, page = 0, size = 10) {
        return axiosInstance.get<{ data: PageResponse<UserSummaryResponse> }>(
            `${BASE}/admin/users/search`,
            { params: { keyword: keyword || undefined, page, size } },
        );
    },

    /** GET /api/users/admin/{userId}/badge */
    getUserBadgeDetail(userId: number) {
        return axiosInstance.get<{ data: UserBadgeDetailResponse }>(`${BASE}/admin/${userId}/badge`);
    },

    /** GET /api/users/admin/badges/stats */
    getBadgeStats() {
        return axiosInstance.get<{ data: BadgeStatsResponse }>(`${BASE}/admin/badges/stats`);
    },

    /** GET /api/users/admin/badges/users?badgeType=&page=&size= */
    getUsersByBadgeType(badgeType: BadgeType, page = 0, size = 20) {
        return axiosInstance.get<{ data: PageResponse<UserSummaryResponse> }>(
            `${BASE}/admin/badges/users`,
            { params: { badgeType, page, size } },
        );
    },
};
