/**
 * React Query keys — tập trung tất cả queryKey strings.
 * Dùng những constants này trong useQuery/useMutation để tránh typo.
 */
export const QUERY_KEYS = {
  CHAT_MESSAGES: 'chat-messages',
  CONVERSATIONS: 'conversations',
  PINNED_MESSAGES: 'pinned-messages',
} as const;
