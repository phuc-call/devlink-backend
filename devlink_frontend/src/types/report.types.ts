// src/types/report.types.ts

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
export type TargetType = 'POST' | 'COMMENT' | 'COMMENT_REPLY';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';
 
 

export type RestrictionType = 'COMMENT_BAN' | 'POST_BAN' | 'FULL_BAN';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
    SPAM:          'Spam hoặc quảng cáo',
    VIOLENCE:      'Bạo lực hoặc nội dung gây hại',
    INAPPROPRIATE: 'Nội dung không phù hợp',
    FAKE:          'Giả mạo hoặc thông tin sai lệch',
    OTHER:         'Lý do khác',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
    PENDING:  'Chờ xử lý',
    RESOLVED: 'Đã xử lý',
    REJECTED: 'Đã từ chối',
};

export const RESTRICTION_TYPE_LABELS: Record<RestrictionType, string> = {
    COMMENT_BAN: 'Cấm bình luận',
    POST_BAN:    'Cấm đăng bài',
    FULL_BAN:    'Cấm toàn bộ',
};

export const TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
    POST:          'Bài viết',
    COMMENT:       'Bình luận',
    COMMENT_REPLY: 'Trả lời bình luận',
    TEMPLATE:      'Template',
    POST_FILE:     'File đính kèm',
    USER:          'Người dùng',
};

// ── Request types ──────────────────────────────────────────────────────

export interface CreateReportRequest {
    targetId:     number;
    targetType:   ReportTargetType;
    reason:       ReportReason;
    description?: string;
}

export interface ReportReviewRequest {
    approved:    boolean;
    reviewNote?: string;
    permanent:   boolean;
}

// ── Response types ─────────────────────────────────────────────────────

export interface ReportResponse {
    id:            number;
    reporterId:    number;
    targetId:      number;
    targetType:    ReportTargetType;
    reason:        ReportReason;
    description:   string | null;
    status:        ReportStatus;
    reviewNote:    string | null;
    reviewedBy:    number | null;
    reviewedAt:    string | null;
    restrictionId: number | null;
    expiresAt:     string | null;
    createdAt:     string;
    updatedAt:     string;
}

// Item trong danh sách báo cáo (admin)
export interface ReportItemResponse {
    reportId:       number;
    targetId:       number;
    targetType:     ReportTargetType;
    violatorUserId: number;
    violatorName:   string | null;
    reporterId:     number;
    reporterName:   string | null;
    reason:         ReportReason;
    description:    string | null;
    status:         ReportStatus;
    createdAt:      string;
}

export interface ReportPageResponse {
    items:         ReportItemResponse[];
    page:          number;
    size:          number;
    totalElements: number;
    totalPages:    number;
}

// Chi tiết báo cáo — người tố cáo xem (gắn với notificationId)
export interface ReportDetailResponse {
    reportId:       number;
    targetType:     string;
    targetId:       number;
    reason:         string;
    description:    string | null;
    targetContent:  unknown;   // snapshot: Post / Comment / CommentReply object
    contentDeleted: boolean;
}

// Vi phạm của chính mình
export interface MyViolationResponse {
    restrictionId:   number;
    restrictionType: RestrictionType;
    reason:          string;
    permanent:       boolean;
    restrictedUntil: string | null;  // ISO instant
    createdAt:       string;
    targetType:      ReportTargetType | null;
    targetId:        number | null;
    deletedSnapshot: unknown;        // null nếu Redis TTL hết
}

export interface PostSnapshot {
    id: number;
    content: string;
    authorId: number;
    visibility: string | null;
    createdAt: string | null;
    tags: string[];
    mediaUrls: string[];
}
export interface CommentSnapshot {
    id: number;
    content: string;
    postId: number;
    authorId: number;
    createdAt: string | null;
}
 export interface ReportDetailResponse {
    reportId: number;
    targetType: TargetType;
    targetId: number;
    reason: string;
    description: string | null;
    targetContent: PostSnapshot | CommentSnapshot | null; // null nếu Redis hết TTL
    contentDeleted: boolean;
}

export interface MyViolationResponse {
    restrictionId: number;
    restrictionType: RestrictionType;
    reason: string;
    permanent: boolean;
    restrictedUntil: string | null;
    createdAt: string;
    targetType: TargetType | null;
    targetId: number | null;
    deletedSnapshot: PostSnapshot | CommentSnapshot | null;
}