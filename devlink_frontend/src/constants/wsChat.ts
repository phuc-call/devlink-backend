/**
 * WebSocket / STOMP constants - phai khop 100% voi Constants.java o backend.
 * Them topic moi: khai bao o day, dung o moi noi.
 */

/** STOMP endpoint path (raw WebSocket, khong SockJS) */
export const WS_ENDPOINT = '/ws-chat';

/** Base queue path cho tin nhan chat */
export const WS_QUEUE_MESSAGES = '/queue/messages';

/** Queue nhan media sau khi upload async */
export const WS_QUEUE_MESSAGES_MEDIA = WS_QUEUE_MESSAGES + '/media';

/** Queue nhan thong bao loi upload */
export const WS_QUEUE_ERRORS = '/queue/errors';

/** Queue update conversation config */
export const WS_QUEUE_CONVERSATIONS_UPDATE = '/queue/conversations.update';

/**
 * Heartbeat (ms) - phai dong bo voi heartbeat phia backend.
 * Backend SimpleBroker mac dinh 10 000 ms.
 */
export const WS_HEARTBEAT_MS = 10_000;

/** Thoi gian cho truoc khi thu ket noi lai (ms) */
export const WS_RECONNECT_DELAY_MS = 5_000;

/** WebSocket action types — phải khớp 100% với backend action strings */
export const WS_ACTIONS = {
  DELETE_MESSAGE_FOR_ME: 'DELETE_MESSAGE_FOR_ME',
  DELETE_MEDIA_FOR_ME: 'DELETE_MEDIA_FOR_ME',
  RECALL_MESSAGE: 'RECALL_MESSAGE',
} as const;

/** STOMP topic path builders cho conversation-specific events */
export const WS_TOPICS = {
  CHAT_PINNED: (convId: number) => `/topic/chat.pinned.${convId}`,
  CHAT_UNPINNED: (convId: number) => `/topic/chat.unpinned.${convId}`,
  CHAT_READ: (convId: number) => `/topic/chat.read.${convId}`,
} as const;

/** WebSocket endpoint paths cho từng service */
export const WS_SERVICES = {
  USER: '/ws-user',
  POST: '/ws-post',
  CHAT: '/ws-chat',
} as const;

/** Query parameter prefix cho WS connection với token */
export const WS_CHAT_TOKEN_SUFFIX = '/ws-chat?token=';
