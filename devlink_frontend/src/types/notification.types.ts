
export type NotificationType = 'BIRTHDAY' | 'FOLLOW' | 'FOLLOW_BACK' | 'FOLLOW_REQUEST';

export interface NotificationResponse {
    id: number;
    actorId: number;
    actorName: string;
    actorAvatar?: string;
    type: NotificationType;
    content: string;
    isRead: boolean;
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