
import Dexie, { type EntityTable } from 'dexie';
import type { ConversationResponse } from '../types/chat.types';

export interface LocalMessage {
  id: string; // Use String(serverId) for synced messages, or clientTempId for temp messages
  conversationId: number;
  senderId: number;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  status: 'sending' | 'sent' | 'failed';
  isRecalled: boolean;
  clientTempId?: string;
  mediaList?: any[];
  attachmentList?: any[];
  files?: File[];
  filePreviewUrls?: string[];
  serverId?: number;
}

export interface LocalPinnedMessage {
  id: string; // Pinned message ID
  messageId: string; // Original message ID
  conversationId: string;
  content: string;
  senderName: string;
  senderAvatar: string;
  createdAt: string;
  media?: any;
  attachment?: any;
}

export interface LocalConversationConfig {
  conversationId: string; // The conversation ID as string
  themeColor: string;
  backgroundImageUrl: string | null;
}

const db = new Dexie('DevLinkDatabase') as Dexie & {
  messages: EntityTable<LocalMessage, 'id'>;
  conversations: EntityTable<ConversationResponse, 'id'>;
  pinnedMessages: EntityTable<LocalPinnedMessage, 'id'>;
  conversationConfigs: EntityTable<LocalConversationConfig, 'conversationId'>;
};

// V3 for existing users
db.version(3).stores({
  messages: 'id, conversationId, createdAt, clientTempId, [conversationId+createdAt]',
  conversations: 'id, lastMessageAt, isPinned',
  pinnedMessages: 'id, conversationId'
});

// V4 to add conversationConfigs
db.version(4).stores({
  messages: 'id, conversationId, createdAt, clientTempId, [conversationId+createdAt]',
  conversations: 'id, lastMessageAt, isPinned',
  pinnedMessages: 'id, conversationId',
  conversationConfigs: 'conversationId'
});

export { db };
