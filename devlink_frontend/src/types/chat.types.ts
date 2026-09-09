export interface SendMessageRequest {
    conversationId: number;
    content?: string;
    files?: File[];
    clientTempId?: string;
}

export interface MessageResponse {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderAvatar?: string;
    content: string;
    createdAt: string;
    clientTempId?: string;
}

export interface CreateConversationRequest {
    receiverId: number;
}

export interface ConversationResponse {
    id: number;
    type: string;
    createdAt: string;
}

export interface MediaResponse {
    id: number;
    mediaType: 'IMAGE' | 'VIDEO';
    fileUrl: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    width?: number;
    height?: number;
    fileSize?: number;
}

export interface AttachmentResponse {
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
}

export interface MessageHistoryResponse {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderAvatar?: string;
    content: string;
    isRecalled?: boolean;
    recalled?: boolean;
    recalledAt?: string;
    createdAt: string;
    mediaList: MediaResponse[];
    attachmentList: AttachmentResponse[];
}

export interface ConversationMessagesResponse {
    conversationId: number;
    type: string;       // DIRECT | GROUP
    title: string;
    avatarUrl?: string;
    partnerId?: number; // chỉ dành cho DIRECT
    isBlocked: boolean;
    messages: MessageHistoryResponse[];
    nextCursor?: number;
    hasMore: boolean;
}
