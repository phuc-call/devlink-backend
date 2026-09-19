import { useMutation } from '@tanstack/react-query';
import { chatApi } from '../../../api/chat-service/chatApi';
import { db } from '../../../utils/db';
import type { SendMessageRequest } from '../../../types/chat.types';
import { CHAT_MESSAGES } from '../../../constants/messages';
import { MESSAGE_STATUS } from '../../../constants/chat';

export function useSendMessage() {
  return useMutation({
    mutationFn: async (params: { request: SendMessageRequest; localMsgId: string }) => {
      // Gọi API gửi tin
      const res = await chatApi.sendMessage(params.request);
      return { serverMsg: res.data, localMsgId: params.localMsgId };
    },
    onMutate: async (_variables) => {
       // Không cần làm gì ở đây, vì component đã tạo tin nhắn tạm trong Dexie trước khi gọi hook.
    },
    onSuccess: async ({ serverMsg, localMsgId }) => {
      // Thành công -> Thay đổi ID, cập nhật trạng thái 'sent'
      const idStr = String(serverMsg.id);
      
      // Thay temp message bằng real message (đổi ID)
      await db.transaction('rw', db.messages, db.conversations, async () => {
        const tempMsg = await db.messages.get(localMsgId);
        if (tempMsg) {
          await db.messages.delete(localMsgId);
          await db.messages.put({
            ...tempMsg,
            id: idStr,
            serverId: serverMsg.id,
            status: MESSAGE_STATUS.SENT,
            clientTempId: serverMsg.clientTempId
          });
        }
        
        const existingConv = await db.conversations.get(serverMsg.conversationId);
        if (existingConv) {
            let newContent = serverMsg.content;
            if (!newContent) newContent = CHAT_MESSAGES.SENT_FILE_FALLBACK;
            await db.conversations.update(serverMsg.conversationId, {
                lastMessageAt: serverMsg.createdAt,
                lastMessageContent: newContent,
                countUnreadMessages: 0
            });
        }
      });
    },
    onError: async (_error, variables) => {
      // Thất bại -> cập nhật status thành 'failed'
      await db.messages.update(variables.localMsgId, { status: MESSAGE_STATUS.FAILED });
    }
  });
}
