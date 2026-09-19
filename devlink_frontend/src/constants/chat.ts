/**
 * Chat constants — loại conversation, loại message, message status, filter types.
 * Phải khớp với giá trị backend trả về.
 */

/** Loại conversation */
export const CONVERSATION_TYPES = {
  DIRECT: 'DIRECT',
  GROUP: 'GROUP',
} as const;

/** Loại message đặc biệt */
export const MESSAGE_TYPES = {
  SYSTEM: 'SYSTEM',
  IMAGE: 'IMAGE',
} as const;

/** Trạng thái tin nhắn local (IndexedDB) */
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

/** Loại action trong context menu chat */
export const CHAT_ACTIONS = {
  DELETE: 'delete',
  RECALL: 'recall',
} as const;

/** Filter tabs trong chat sidebar */
export const CHAT_FILTER_TYPES = {
  ALL: 'ALL Chat',
  FOLLOWING: 'FOLLOWING',
  FOLLOWERS: 'FOLLOWERS',
  FRIENDS: 'FRIENDS',
} as const;

/** Các hằng số UI nhỏ trong chat */
export const CHAT_UI = {
  LOCALE: 'vi-VN',
  KEYBOARD_ENTER: 'Enter',
  MIME_IMAGE: 'image/',
  MIME_VIDEO: 'video/',
  FILE_SIZE_B: ' B',
  FILE_SIZE_KB: ' KB',
  FILE_SIZE_MB: ' MB',
  PINNED_PREFIX: 'Tin nhắn ghim - ',
  PINNED_NO_TEXT: '"Đính kèm/Hình ảnh"',
} as const;
