import axiosInstance from '../axiosInstance';
import type { SendMessageRequest, MessageResponse, CreateConversationRequest, ConversationResponse, ConversationMessagesResponse, MessageHistoryResponse } from '../../types/chat.types';

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

    // Lấy danh sách tin nhắn theo conversationId (cursor-based pagination)
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

    // Cập nhật API theo yêu cầu
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
    createOrGetDirectConversation: async (request: CreateConversationRequest): Promise<{ success: boolean; data: ConversationResponse; message: string }> => {
        const response = await axiosInstance.post<{ success: boolean; data: ConversationResponse; message: string }>(
            '/api/chat/conversations',
            request
        );
        return response.data;
    }
};
