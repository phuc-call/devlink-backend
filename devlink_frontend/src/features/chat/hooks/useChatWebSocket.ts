import { useEffect, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import { db } from '../../../utils/db';
import { chatApi } from '../../../api/chat-service/chatApi';
import type { MessageHistoryResponse } from '../../../types/chat.types';
import {
  WS_HEARTBEAT_MS,
  WS_QUEUE_MESSAGES,
  WS_QUEUE_MESSAGES_MEDIA,
  WS_RECONNECT_DELAY_MS,
  WS_ACTIONS,
  WS_TOPICS,
  WS_CHAT_TOKEN_SUFFIX,
  WS_QUEUE_CONVERSATIONS_UPDATE,
} from '../../../constants/wsChat';
import { STORAGE_KEYS, STORAGE_VALUES } from '../../../constants/storage';
import { MESSAGE_STATUS } from '../../../constants/chat';
import { CHAT_MESSAGES } from '../../../constants/messages';

export function useChatWebSocket(currentUserId: number | null, conversationId: number | null) {
  const stompClientRef = useRef<Client | null>(null);
  const convSubRef = useRef<any[]>([]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === STORAGE_VALUES.LOGGED_IN_TRUE;
    if (!isLoggedIn || !currentUserId) return;

    const baseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || '';

    const wsUrl = baseUrl.replace(/^http/, 'ws') + WS_CHAT_TOKEN_SUFFIX + token;

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: WS_RECONNECT_DELAY_MS,
      heartbeatIncoming: WS_HEARTBEAT_MS,
      heartbeatOutgoing: WS_HEARTBEAT_MS,
      onConnect: () => {
        console.log('[STOMP] Connected to chat-service');

        client.subscribe(`${WS_QUEUE_MESSAGES}/${currentUserId}`, async (message: IMessage) => {
          try {
            const data = JSON.parse(message.body);

            if (data.action === WS_ACTIONS.DELETE_MESSAGE_FOR_ME) {
              await db.messages.delete(String(data.messageId));
              return;
            }

            if (data.action === WS_ACTIONS.DELETE_MEDIA_FOR_ME) {
              const allMsgs = await db.messages.where('conversationId').equals(data.conversationId).toArray();
              for (const msg of allMsgs) {
                if (msg.mediaList) {
                  const originalLength = msg.mediaList.length;
                  msg.mediaList = msg.mediaList.filter((m: any) => !data.mediaIds.includes(m.id));
                  if (msg.mediaList.length < originalLength) {
                    if (msg.mediaList.length === 0 && (!msg.content || msg.content === '')) {
                      await db.messages.delete(msg.id);
                    } else {
                      await db.messages.update(msg.id, { mediaList: msg.mediaList });
                    }
                  }
                }
              }
              return;
            }

            if (data.action === WS_ACTIONS.RECALL_MESSAGE) {
              await db.messages.update(String(data.messageId), { isRecalled: true });
              return;
            }

            const newMsg: MessageHistoryResponse = data;
            const idStr = String(newMsg.id);
            const existing = await db.messages.get(idStr);
            if (!existing) {
              let isMyTempMessage = false;
              if ((newMsg as any).clientTempId) {
                const tempMsg = await db.messages.get((newMsg as any).clientTempId);
                if (tempMsg) {
                  isMyTempMessage = true;
                }
              }

              if (!isMyTempMessage) {
                await db.messages.put({
                  id: idStr,
                  serverId: newMsg.id,
                  conversationId: newMsg.conversationId,
                  senderId: newMsg.senderId,
                  senderName: newMsg.senderName,
                  senderAvatar: newMsg.senderAvatar,
                  content: newMsg.content,
                  createdAt: newMsg.createdAt,
                  status: MESSAGE_STATUS.SENT,
                  isRecalled: newMsg.isRecalled || false,
                  mediaList: newMsg.mediaList,
                  attachmentList: newMsg.attachmentList,
                });
              }
            }

            let existingConv = await db.conversations.get(newMsg.conversationId);
            if (!existingConv) {
              // Giao diện bên này chưa có conversation (ví dụ: device 1 tạo conversation mới, device 2 chưa có)
              // Gọi API để lấy danh sách mới nhất về ghi đè local DB
              try {
                const res = await chatApi.getConversations(0, 20);
                if (res.success && res.data && res.data.content) {
                  for (const sConv of res.data.content) {
                    await db.conversations.put(sConv);
                  }
                }
                existingConv = await db.conversations.get(newMsg.conversationId);
              } catch (e) {
                console.error('Failed to sync conversations on new message', e);
              }
            }

            if (existingConv) {
              const isMyMsg = newMsg.senderId === currentUserId;
              let newContent = newMsg.content;
              if (!newContent && newMsg.mediaList && newMsg.mediaList.length > 0) {
                newContent = CHAT_MESSAGES.SENT_FILE_FALLBACK;
              }
              await db.conversations.update(newMsg.conversationId, {
                lastMessageAt: newMsg.createdAt,
                lastMessageContent: newContent,
                countUnreadMessages: isMyMsg ? 0 : (existingConv.countUnreadMessages || 0) + 1,
              });
            }
          } catch (e) {
            console.error('[STOMP] Failed to handle incoming message', e);
          }
        });

        client.subscribe(`${WS_QUEUE_MESSAGES_MEDIA}/${currentUserId}`, async (message: IMessage) => {
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
            console.error('[STOMP] Failed to handle media update', e);
          }
        });

        client.subscribe(`${WS_QUEUE_CONVERSATIONS_UPDATE}/${currentUserId}`, async (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload && payload.conversationId) {
              if (payload.action && (payload.action === 'PIN_CONVERSATION' || payload.action === 'UNPIN_CONVERSATION')) {
                const conv = await db.conversations.get(payload.conversationId);
                if (conv) {
                  await db.conversations.update(payload.conversationId, {
                    isPinned: payload.action === 'PIN_CONVERSATION',
                    pinnedAt: payload.pinnedAt || null
                  });
                }
              } else if (payload.themeColor !== undefined || payload.backgroundImageUrl !== undefined) {
                await db.conversationConfigs.put({
                  conversationId: String(payload.conversationId),
                  themeColor: payload.themeColor,
                  backgroundImageUrl: payload.backgroundImageUrl
                });
              }
            }
          } catch (e) {
            console.error('[STOMP] Failed to handle config update', e);
          }
        });

        // Handle topic subscriptions if conversationId is present on connect
        subscribeToConversationTopics(client, conversationId);
      },
      onStompError: (frame) => {
        console.error('[STOMP] Broker error:', frame.headers['message']);
      },
      onDisconnect: () => {
        console.log('[STOMP] Disconnected');
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [currentUserId]);

  // Effect for conversationId changes (to subscribe/unsubscribe dynamically)
  useEffect(() => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      subscribeToConversationTopics(stompClientRef.current, conversationId);
    }
  }, [conversationId]);

  const subscribeToConversationTopics = (client: Client, convId: number | null) => {
    // Unsubscribe from previous conversation topics
    convSubRef.current.forEach(sub => sub.unsubscribe());
    convSubRef.current = [];

    if (convId) {
      const sub1 = client.subscribe(WS_TOPICS.CHAT_PINNED(convId), async (message: IMessage) => {
        try {
          const pin = JSON.parse(message.body);
          await db.pinnedMessages.put({
            id: String(pin.id),
            messageId: String(pin.messageId),
            conversationId: String(pin.conversationId),
            content: pin.content,
            senderName: pin.senderName,
            senderAvatar: pin.senderAvatar,
            createdAt: pin.createdAt
          });
        } catch (e) { console.error('Failed to parse pinned message ws', e); }
      });

      const sub2 = client.subscribe(WS_TOPICS.CHAT_UNPINNED(convId), async (message: IMessage) => {
        try {
          const pinnedMessageId = message.body;
          await db.pinnedMessages.delete(String(pinnedMessageId));
        } catch (e) { }
      });

      const sub3 = client.subscribe(WS_TOPICS.CHAT_READ(convId), async (message: IMessage) => {
        try {
          const readUserId = Number(message.body);
          if (readUserId === currentUserId) {
            await db.conversations.update(convId, { countUnreadMessages: 0 });
          }
        } catch (e) { }
      });

      convSubRef.current = [sub1, sub2, sub3];
    }
  };

  return stompClientRef;
}
