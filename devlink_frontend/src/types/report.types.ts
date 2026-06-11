

export type ReportTargetType =
    | 'POST'
    | 'COMMENT'
    | 'COMMENT_REPLY'
    | 'TEMPLATE'
    | 'POST_FILE'
    | 'USER';

export type ReportReason =
    | 'SPAM'
    | 'VIOLENCE'
    | 'INAPPROPRIATE'
    | 'FAKE'
    | 'OTHER';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';


export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
    SPAM:          'Spam hoặc quảng cáo',
    VIOLENCE:      'Bạo lực hoặc nội dung gây hại',
    INAPPROPRIATE: 'Nội dung không phù hợp',
    FAKE:          'Giả mạo hoặc thông tin sai lệch',
    OTHER:         'Lý do khác',
};


export interface CreateReportRequest {
    targetId:    number;
    targetType:  ReportTargetType;
    reason:      ReportReason;
    description?: string;
}

export interface ReportResponse {
    id:          number;
    reporterId:  number;
    targetId:    number;
    targetType:  ReportTargetType;
    reason:      ReportReason;
    description: string | null;
    status:      ReportStatus;
    createdAt:   string;
    updatedAt:   string;
}