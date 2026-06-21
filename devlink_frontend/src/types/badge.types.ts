export interface CreateBadgeConfigRequest {
    popularThreshold: number;
    bleuTickThreshold: number;
    minCompletionPercent: number;
    blueTickPendingRatio: number;
    gracePeriodDays: number;
}

export interface UpdateBadgeVideoLimitRequest {
    maxSeconds: number;
    maxCount: number;
}

export interface GrantRedTickBatchRequest {
    userIds: number[];
    reason?: string;
}

export interface BadgeConfigResponse {
    id: number;
    popularThreshold: number;
    bleuTickThreshold: number;
    minCompletionPercent: number;
    blueTickPendingRatio: number;
    gracePeriodDays: number;
    isActive: boolean;
    updatedAt: string;
    updatedBy: number;
}

export interface BadgeVideoLimitResponse {
    badgeType: string;
    maxSeconds: number;
    maxCount: number;
    updatedAt: string;
    updatedBy: number;
}

export interface BadgeGrantResponse {
    userId: number;
    badge: BadgeType;
    message: string;
    grantedAt: string;
}

export interface UserSummaryResponse {
    id: number;
    username: string;
    email: string;
    badge: BadgeType;
    status: string;
    avatarUrl: string | null;
}

export interface BadgeHistoryItemResponse {
    badgeType: BadgeType;
    grantedBy: string;
    reason: string | null;
    followerCountSnapshot: number | null;
    createdAt: string;
}

export interface UserBadgeDetailResponse {
    userId: number;
    username: string;
    email: string;
    currentBadge: BadgeType;
    history: BadgeHistoryItemResponse[];
}

export interface BadgeStatsResponse {
    none: number;
    popular: number;
    blueTick: number;
    redTick: number;
    total: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export type BadgeType = 'NONE' | 'POPULAR' | 'BLUE_TICK' | 'RED_TICK';

export const BADGE_LABELS: Record<BadgeType, string> = {
    NONE: 'Không có',
    POPULAR: '⭐ Popular',
    BLUE_TICK: '🔵 Blue Tick',
    RED_TICK: '🔴 Red Tick',
};

export const BADGE_COLORS: Record<BadgeType, { bg: string; color: string; border: string }> = {
    NONE: { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
    POPULAR: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    BLUE_TICK: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
    RED_TICK: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};