import axiosInstance from '../axiosInstance';
import type { SendMessageRequest, MessageResponse, CreateConversationRequest, ConversationResponse, ConversationMessagesResponse, MessageHistoryResponse, SliceResponse } from '../../types/chat.types';

export const chatApi = {
    // Message APIs
    sendMessage: async (request: SendMessageRequest): Promise<{ success: boolean; data: MessageResponse; message: string }> => {
        const formData = new FormData();
        formData.append('conversationId', request.conversationId.toString());

        if (request.content) {
            formData.append('content', request.content);
        }

        if (request.files && request.files.length > 0) {
            request.files.forEach(file => {
                formData.append('files', file);
            });
        }

        if (request.clientTempId) {
            formData.append('clientTempId', request.clientTempId);
        }

        const response = await axiosInstance.post<{ success: boolean; data: MessageResponse; message: string }>(
            '/api/chat/messages',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    },

    // Láº¥y danh sÃ¡ch tin nháº¯n theo conversationId (cursor-based pagination)
    getMessages: async (
        conversationId: number,
        cursor?: number,
        limit: number = 20
    ): Promise<{ success: boolean; data: ConversationMessagesResponse; message: string }> => {
        const params: Record<string, string | number> = { limit };
        if (cursor !== undefined) {
            params.cursor = cursor;
        }

        const response = await axiosInstance.get<{ success: boolean; data: ConversationMessagesResponse; message: string }>(
            `/api/chat/messages/conversations/${conversationId}`,
            { params }
        );
        return response.data;
    },

    // Cáº­p nháº­t API theo yÃªu cáº§u
    searchMessages: async (
        conversationId: number,
        keyword: string
    ): Promise<{ success: boolean; data: MessageHistoryResponse[]; message: string }> => {
        const response = await axiosInstance.get<{ success: boolean; data: MessageHistoryResponse[]; message: string }>(
            `/api/chat/messages/conversations/${conversationId}/search`,
            { params: { keyword } }
        );
        return response.data;
    },
    recallMessage: async (messageId: number): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.put(`/api/chat/messages/${messageId}/recall`);
        return response.data;
    },

    deleteMessageForMe: async (messageId: number): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.delete(`/api/chat/messages/${messageId}`);
        return response.data;
    },

    deleteMediaForMe: async (conversationId: number, mediaIds: number[]): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.delete(`/api/chat/messages/conversations/${conversationId}/media`, {
            data: mediaIds // Axios uses 'data' for DELETE body
        });
        return response.data;
    },

    // Conversation APIs
    getConversations: async (page: number = 0, size: number = 20): Promise<{ success: boolean; data: SliceResponse<ConversationResponse>; message: string }> => {
        const response = await axiosInstance.get('/api/chat/conversations', {
            params: { page, size }
        });
        return response.data;
    },

    createOrGetDirectConversation: async (request: CreateConversationRequest): Promise<{ success: boolean; data: ConversationResponse; message: string }> => {
        const response = await axiosInstance.post<{ success: boolean; data: ConversationResponse; message: string }>(
            '/api/chat/conversations',
            request
        );
        return response.data;
    },

    markConversationAsRead: async (conversationId: number): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.put(`/api/chat/conversations/${conversationId}/read`);
        return response.data;
    },

    pinConversation: async (conversationId: number): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.put(`/api/chat/conversations/${conversationId}/pin`);
        return response.data;
    },

    // Pinned Message APIs
    pinMessage: async (messageId: number): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.post(`/api/chat/pinned-messages/${messageId}`);
        return response.data;
    },

    unpinMessage: async (pinnedMessageId: number): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.delete(`/api/chat/pinned-messages/${pinnedMessageId}`);
        return response.data;
    },

    getPinnedMessages: async (conversationId: number): Promise<{ success: boolean; data: any[]; message: string }> => {
        const response = await axiosInstance.get(`/api/chat/pinned-messages/conversation/${conversationId}`);
        return response.data;
    },

    // Conversation Config APIs
    getConfig: async (conversationId: number): Promise<{ success: boolean; data: { conversationId: number; backgroundImageUrl: string | null; themeColor: string; }; message: string }> => {
        const response = await axiosInstance.get(`/api/chat/conversations/${conversationId}/configs`);
        return response.data;
    },

    updateConfig: async (conversationId: number, themeColor?: string, backgroundFile?: File): Promise<{ success: boolean; data: { conversationId: number; backgroundImageUrl: string | null; themeColor: string; }; message: string }> => {
        const formData = new FormData();
        if (themeColor) formData.append('themeColor', themeColor);
        if (backgroundFile) formData.append('backgroundFile', backgroundFile);

        const response = await axiosInstance.put(`/api/chat/conversations/${conversationId}/configs`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    getConversationMedia: async (
        conversationId: number,
        filter?: {
            uploaderId?: number;
            mediaType?: 'IMAGE' | 'VIDEO' | 'FILE';
            fromDate?: string;
            toDate?: string;
            page?: number;
            size?: number;
        }
    ): Promise<{ success: boolean; data: any; message: string }> => {
        const response = await axiosInstance.get(`/api/chat/conversations/${conversationId}/media`, { params: filter });
        return response.data;
    }
};
