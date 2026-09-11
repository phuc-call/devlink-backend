import { useMutation } from '@tanstack/react-query';
import { chatApi } from '../../../api/chat-service/chatApi';
import { db } from '../../../utils/db';
import type { SendMessageRequest } from '../../../types/chat.types';

export function useSendMessage() {
  return useMutation({
    mutationFn: async (params: { request: SendMessageRequest; localMsgId: string }) => {
      // Gọi API gửi tin
      const res = await chatApi.sendMessage(params.request);
      return { serverMsg: res.data, localMsgId: params.localMsgId };
    },
    onMutate: async (_variables) => {
       // Không cần làm gì ở đây vì đã tạo tin nhắn tạm trong component và lưu vào Dexie trước khi gọi hook.
    },
    onSuccess: async ({ serverMsg, localMsgId }) => {
      // Thành công -> Thay đổi ID, cập nhật trạng thái 'sent'
      const idStr = String(serverMsg.id);
      
      // Chúng ta sẽ replace temp message bằng real message (đổi ID)
      await db.transaction('rw', db.messages, async () => {
        const tempMsg = await db.messages.get(localMsgId);
        if (tempMsg) {
          // Xóa tin tạm
          await db.messages.delete(localMsgId);
          // Insert tin thật (với id thật)
          await db.messages.put({
            ...tempMsg,
            id: idStr,
            serverId: serverMsg.id,
            status: 'sent',
            clientTempId: serverMsg.clientTempId
          });
        }
      });
    },
    onError: async (_error, variables) => {
      // Thất bại -> cập nhật status thành 'failed'
      await db.messages.update(variables.localMsgId, { status: 'failed' });
    }
  });
}
