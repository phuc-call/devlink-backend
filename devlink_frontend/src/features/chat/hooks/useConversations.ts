import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { chatApi } from '../../../api/chat-service/chatApi';
import { db } from '../../../utils/db';
import { QUERY_KEYS } from '../../../constants/queryKeys';

export function useConversations() {
  // 1. Reactive query từ Local DB
  const localConversations = useLiveQuery(
    () => {
      // Sắp xếp: pinned trước, sau đó đến lastMessageAt
      return db.conversations.toArray().then(arr => 
        arr.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;

          // Cả hai đều ghim HOẶC cả hai đều không ghim -> Sắp xếp theo tin nhắn mới nhất
          const timeA = new Date(a.lastMessageAt || 0).getTime();
          const timeB = new Date(b.lastMessageAt || 0).getTime();
          return timeB - timeA;
        })
      );
    },
    []
  ) || [];

  // 2. Đồng bộ từ Server (Delta Sync)
  const query = useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS],
    queryFn: async () => {
      const res = await chatApi.getConversations(0, 20); // Lấy 20 cuộc hội thoại mới nhất
      const serverConvs = res.data.content;
      
      await db.transaction('rw', db.conversations, async () => {
        for (const sConv of serverConvs) {
          // Upsert từng cuộc hội thoại
          await db.conversations.put(sConv);
        }
      });
      return res.data;
    },
    staleTime: 60000,
  });

  return {
    conversations: localConversations,
    isLoading: query.isLoading && localConversations.length === 0,
    isRefetching: query.isRefetching
  };
}