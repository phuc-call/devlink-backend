package com.devlink.chat_service.config;

public final class Constants {
    private Constants() {
    }

    public static final String[] PUBLIC_ENDPOINT = {
            "/v3/api-docs",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/chat-service/v3/api-docs/**",
            "/ws-chat/**"
    };

    public static final String PAGE_NUMBER = "0";
    public static final String PAGE_SIZE = "2";
    public static final String SORT_DIR = "asc";
    public static final String DIRECTION = "DESC";
    public static final int OPS_EXPIRATION_MINUTES = 5;

    /** STOMP endpoint path registered in AppConfig */
    public static final String WS_ENDPOINT = "/ws-chat";

    /** Broker user-destination prefix (Spring convention: /user/{name}/...) */
    public static final String WS_BROKER_USER_PREFIX = "/user";

    /** Application destination prefix for @MessageMapping handlers */
    public static final String WS_APP_PREFIX = "/app";

    /**
     * Base queue path for chat messages.
     * Full per-user destination: WS_QUEUE_MESSAGES + "/" + userId
     * e.g. /queue/messages/42
     */
    public static final String WS_QUEUE_MESSAGES = "/queue/messages";

    /**
     * Per-user media-upload notification queue.
     * Full: WS_QUEUE_MESSAGES_MEDIA + "/" + userId
     */
    public static final String WS_QUEUE_MESSAGES_MEDIA = WS_QUEUE_MESSAGES + "/media";

    /**
     * Per-user error notification queue.
     * Full: WS_QUEUE_ERRORS + "/" + userId
     */
    public static final String WS_QUEUE_ERRORS = "/queue/errors";

    // Heartbeat
    /** Milliseconds between STOMP heart-beat frames (both directions) */
    public static final long WS_HEARTBEAT_MS = 10_000L;

    // pin Conversation
    public static final String UnPin = "UNPIN";
    public static final String Pin = "PIN";

    // System Messages
    public static final String MSG_DIRECT_CONNECTED = "Hai bạn đã được kết nối. Hãy gửi một lời chào!";
    public static final String MSG_GROUP_CREATED_PREFIX = "Nhóm ";
    public static final String MSG_GROUP_CREATED_SUFFIX = " đã được tạo!";
    public static final String DEFAULT_GROUP_AVATAR = "default";

    // WebSocket Topics & Queues
    public static final String TOPIC_CHAT_READ_PREFIX = "/topic/chat.read.";
    public static final String QUEUE_CONVERSATIONS_UPDATE = "/queue/conversations.update";

    // JSON Payload Keys
    public static final String KEY_ACTION = "action";
    public static final String KEY_CONVERSATION_ID = "conversationId";
    public static final String KEY_PINNED_AT = "pinnedAt";

    // Config defaults
    public static final String DEFAULT_THEME_COLOR = "#0084ff";
    public static final String APPLICATION_OCTET_STREAM = "application/octet-stream";
}
