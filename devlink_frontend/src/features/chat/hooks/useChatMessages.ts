import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { chatApi } from '../../../../api/chat-service/chatApi';
import { db, type LocalMessage } from '../../../../utils/db';
import { useEffect } from 'react';

export function useChatMessages(conversationId: number | null) {
  const queryClient = useQueryClient();

  // 1. Lấy dữ liệu từ Dexie theo thời gian thực (Local-first)
  const localMessages = useLiveQuery(
    () => {
      if (!conversationId) return [];
      return db.messages
        .where('conversationId')
        .equals(conversationId)
        .sortBy('createdAt');
    },
    [conversationId]
  ) || [];

  // 2. Gọi API để đồng bộ (chỉ gọi trang đầu khi mở conversation)
  const query = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const res = await chatApi.getMessages(conversationId);
      
      const serverMsgs = res.data.messages;
      
      // Đồng bộ từ server về Dexie
      const tx = await db.transaction('rw', db.messages, async () => {
        for (const sMsg of serverMsgs) {
          const idStr = String(sMsg.id);
          const existing = await db.messages.get(idStr);
          
          if (!existing) {
            // Tin mới từ server -> Insert
            await db.messages.put({
              id: idStr,
              serverId: sMsg.id,
              conversationId: sMsg.conversationId,
              senderId: sMsg.senderId,
              content: sMsg.content,
              createdAt: sMsg.createdAt,
              status: 'sent',
              isRecalled: sMsg.isRecalled,
              mediaList: sMsg.mediaList,
              attachmentList: sMsg.attachmentList
            });
          } else if (sMsg.isRecalled && !existing.isRecalled) {
            // Tin đã bị thu hồi -> Update
            await db.messages.update(idStr, { isRecalled: true });
          } else {
             // Có thể update mediaList, attachmentList nếu cần
             await db.messages.update(idStr, { 
                mediaList: sMsg.mediaList, 
                attachmentList: sMsg.attachmentList 
             });
          }
        }
      });
      return res.data;
    },
    enabled: !!conversationId,
    staleTime: 0, // Luôn refetch khi mở lại
  });

  return {
    messages: localMessages,
    isLoading: query.isLoading && localMessages.length === 0,
    hasMore: query.data?.hasMore || false,
    nextCursor: query.data?.nextCursor,
    isBlocked: query.data?.isBlocked || false,
    query
  };
}
