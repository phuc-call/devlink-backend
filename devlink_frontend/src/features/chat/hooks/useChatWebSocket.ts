import { useEffect, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { db } from '../../../../utils/db';
import type { MessageHistoryResponse } from '../../../../types/chat.types';
import { useQueryClient } from '@tanstack/react-query';

export function useChatWebSocket(currentUserId: number | null) {
  const stompClientRef = useRef<Client | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn || !currentUserId) return;

    const baseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
    const token = localStorage.getItem('accessToken') || '';
    const wsUrl = `${baseUrl}/ws-chat?token=${token}`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[STOMP] Connected to chat-service');
        
        // 1. Lắng nghe tin nhắn mới
        client.subscribe(`/queue/messages/${currentUserId}`, async (message: IMessage) => {
          try {
            const data = JSON.parse(message.body);
            
            // Nếu là event DELETE_MESSAGE_FOR_ME
            if (data.action === 'DELETE_MESSAGE_FOR_ME') {
               await db.messages.delete(String(data.messageId));
               return;
            }
            
            // Nếu là event DELETE_MEDIA_FOR_ME
            if (data.action === 'DELETE_MEDIA_FOR_ME') {
                // Tạm thời, xóa cứng tin chứa media đó khỏi DB (hoặc cập nhật xóa media khỏi mảng mediaList)
                // Vì spec ghi "lặp qua mediaIds, xóa cứng từng item liên quan khỏi Dexie", ta có thể cập nhật
                // Nhưng Dexie không lưu Media riêng lẻ, mà lưu trong mảng mediaList của message.
                // Do data trả về mediaIds, ta cần tìm các message có chứa mediaId này và xóa media đó khỏi danh sách.
                const allMsgs = await db.messages.where('conversationId').equals(data.conversationId).toArray();
                for (const msg of allMsgs) {
                   if (msg.mediaList) {
                       const originalLength = msg.mediaList.length;
                       msg.mediaList = msg.mediaList.filter(m => !data.mediaIds.includes(m.id));
                       if (msg.mediaList.length < originalLength) {
                           if (msg.mediaList.length === 0 && (!msg.content || msg.content === '')) {
                              // Nếu tin nhắn chỉ có hình mà bị xóa hết hình -> xóa luôn tin
                              await db.messages.delete(msg.id);
                           } else {
                              await db.messages.update(msg.id, { mediaList: msg.mediaList });
                           }
                       }
                   }
                }
               return;
            }

            // Nếu là RECALL_MESSAGE
            if (data.action === 'RECALL_MESSAGE') {
                await db.messages.update(String(data.messageId), { isRecalled: true });
                return;
            }
            
            // Tin nhắn mới bình thường
            const newMsg: MessageHistoryResponse = data;
            const idStr = String(newMsg.id);
            
            const existing = await db.messages.get(idStr);
            if (!existing) {
               // Tránh duplicate nếu là tin nhắn mình vừa gửi (có clientTempId)
               // Nếu nó có clientTempId, nó đã được xử lý bởi onMutate/onSuccess của useSendMessage
               if (!newMsg.clientTempId) {
                   await db.messages.put({
                        id: idStr,
                        serverId: newMsg.id,
                        conversationId: newMsg.conversationId,
                        senderId: newMsg.senderId,
                        content: newMsg.content,
                        createdAt: newMsg.createdAt,
                        status: 'sent',
                        isRecalled: newMsg.isRecalled,
                        mediaList: newMsg.mediaList,
                        attachmentList: newMsg.attachmentList
                   });
               }
            }

          } catch (e) {
            console.error('Failed to parse incoming message', e);
          }
        });

        // 2. Lắng nghe cập nhật media cho tin nhắn (Async Upload)
        client.subscribe(`/queue/messages/media/${currentUserId}`, async (message: IMessage) => {
          try {
            const mediaUpdate = JSON.parse(message.body);
            if (mediaUpdate.message?.id) {
               const idStr = String(mediaUpdate.message.id);
               const existing = await db.messages.get(idStr);
               if (existing) {
                   const updatedMediaList = [...(existing.mediaList || []), mediaUpdate];
                   await db.messages.update(idStr, { mediaList: updatedMediaList });
               }
            }
          } catch (e) {
            console.error('Failed to parse incoming media update', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [currentUserId]);

  return stompClientRef;
}
