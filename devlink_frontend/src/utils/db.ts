import Dexie, { type EntityTable } from 'dexie';

export interface LocalMessage {
  id: string; // Use String(serverId) for synced messages, or clientTempId for temp messages
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string;
  status: 'sending' | 'sent' | 'failed';
  isRecalled: boolean;
  clientTempId?: string;
  mediaList?: any[];
  attachmentList?: any[];
  serverId?: number;
}

const db = new Dexie('ChatDatabase') as Dexie & {
  messages: EntityTable<LocalMessage, 'id'>;
};

// Cấu hình schema
// Lệnh index: id là primary key.
// conversationId, createdAt dùng để query và sort.
// [conversationId+createdAt] là compound index.
db.version(1).stores({
  messages: 'id, conversationId, createdAt, clientTempId, [conversationId+createdAt]'
});

export { db };
