// src/types/notification.types.ts

export type NotificationType =
    | 'BIRTHDAY'
    | 'FOLLOW'
    | 'FOLLOW_BACK'
    | 'FOLLOW_REQUEST'
    | 'REPORT'
    | 'REPORT_REVIEWED'
    | 'REPORT_VIOLATION';

export type NotificationAction = 'HIDE' | 'SHOW' | 'DELETE' | 'DELETE_MANY';

export interface NotificationActionRequest {
    action: NotificationAction;
    id?: number;
    ids?: number[];
    passWord?: string;
}

export interface NotificationPasswordSetupRequest {
    otp: string;
    newPassword: string;
}

export interface NotificationResponse {
    id: number;
    actorId: number;
    actorName: string;
    actorAvatar?: string;
    type: NotificationType;
    content: string;
    isRead: boolean;
    isHidden: boolean;
    referenceId?: number;
    referenceType?: string;
    createdAt: string;
}

export interface NotificationPageResponse {
    content: NotificationResponse[];
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    last: boolean;
    number: number;
    size: number;
}