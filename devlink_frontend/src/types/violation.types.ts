// src/types/violation.types.ts

export type TargetType = 'POST' | 'COMMENT' | 'COMMENT_REPLY';

export interface ViolationHistoryResponse {
    id:             number;
    reportId:       number;
    violatorId:     number;
    targetType:     TargetType;
    targetId:       number;
    reason:         string;
    violationAt:    string;
    penaltyStartAt: string;
    penaltyEndAt:   string | null;
    violationCount: number;
    restrictionId:  number | null;
    createdAt:      string;
}

export interface ViolationPageResponse {
    content:       ViolationHistoryResponse[];
    totalElements: number;
    totalPages:    number;
    number:        number;
    size:          number;
}

export interface PenaltyConfigResponse {
    id:            number;
    targetType:    string;
    reason:        string;
    offenseNumber: number;
    penaltyDays:   number;
    permanent:     boolean;
    updatedBy:     number | null;
    updatedAt:     string;
}

export interface ViolationOverviewResponse {
    totalViolations:  number;
    activeViolations: number;
    totalReports:     number;
    pendingReports:   number;
    resolvedReports:  number;
    rejectedReports:  number;
}

export interface UpdatePenaltyConfigRequest {
    penaltyDays: number;
    permanent:   boolean;
}
