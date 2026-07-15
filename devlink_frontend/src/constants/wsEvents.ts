export const WS_EVENTS = {
    // STOMP payload event types
    PAYLOAD_NEW_NOTIFICATION: 'NEW_NOTIFICATION',
    PAYLOAD_BLOCK_UPDATED: 'BLOCK_UPDATED',
    PAYLOAD_NEW_REACTION: 'NEW_REACTION',
    PAYLOAD_NEW_COMMENT: 'NEW_COMMENT',

    // Global Window Event types
    WINDOW_NEW_NOTIFICATION: 'WS_NEW_NOTIFICATION',
    WINDOW_BLOCK_UPDATED: 'WS_BLOCK_UPDATED',

    // Dynamic window event type for specific posts
    getWindowNewCommentEvent: (postId: number | string) => `WS_NEW_COMMENT_${postId}`,
};
