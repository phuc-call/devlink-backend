import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { chatApi } from '../../../api/chat-service/chatApi';
import { db } from '../../../utils/db';
import { QUERY_KEYS } from '../../../constants/queryKeys';

export function usePinnedMessage(conversationId: number | null) {
  const localPinnedMessages = useLiveQuery(
    () => {
      if (!conversationId) return [];
      return db.pinnedMessages
        .where('conversationId')
        .equals(String(conversationId))
        .toArray();
    },
    [conversationId]
  );

  const query = useQuery({
    queryKey: [QUERY_KEYS.PINNED_MESSAGES, conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      try {
          const res = await chatApi.getPinnedMessages(conversationId);
          if (res.data && Array.isArray(res.data)) {
             const pins = res.data;
             
             const newPins = pins.map(pin => ({
                 id: String(pin.id),
                 messageId: String(pin.messageId),
                 conversationId: String(pin.conversationId),
                 content: pin.content,
                 senderName: pin.senderName,
                 senderAvatar: pin.senderAvatar,
                 createdAt: pin.createdAt,
                 media: pin.media,
                 attachment: pin.attachment
             }));

             await db.transaction('rw', db.pinnedMessages, async () => {
                 // Clear previous pinned messages for the current conversation to avoid duplicates
                 const existing = await db.pinnedMessages.where('conversationId').equals(String(conversationId)).toArray();
                 const existingIds = existing.map(e => e.id);
                 await db.pinnedMessages.bulkDelete(existingIds);
                 
                 // Store the newly fetched pinned messages
                 if (newPins.length > 0) {
                     await db.pinnedMessages.bulkPut(newPins);
                 }
             });
             
             return newPins;
          } else {
             // Không có thì xóa luôn
             const existing = await db.pinnedMessages.where('conversationId').equals(String(conversationId)).toArray();
             if (existing.length > 0) {
                 await db.pinnedMessages.bulkDelete(existing.map(e => e.id));
             }
             return [];
          }
      } catch (e) {
          console.error('Failed to fetch pinned messages', e);
          return [];
      }
    },
    enabled: !!conversationId,
  });

  const pinnedMessages = localPinnedMessages !== undefined ? localPinnedMessages : (query.data || []);

  return { pinnedMessages, refetch: query.refetch };
}
