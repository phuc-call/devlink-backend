package com.devlink.user_service.config;

public final class Constants {
    private Constants() {
    }

    public static final String[] PUBLIC_ENDPOINT = {
            "/oauth2/**",
            "/v3/api-docs",
            "/auth/register/**",
            "/auth/login",
            "/auth/refresh",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/user-service/v3/api-docs/**"
    };
    public static final Long SYSTEM_ACTOR_ID = 0L;

    /**
     * Default values for request parameters
     */
    public static final String DEFAULT_PAGE = "0";
    public static final String DEFAULT_PAGE_SIZE = "20";
    public static final String DEFAULT_PAGE_SIZE_SMALL = "10";
    public static final String DEFAULT_BOOLEAN_FALSE = "false";

    public static final int OPS_EXPIRATION_MINUTES = 5;

    public static final String MSG_LOGOUT_SUCCESS = "Logout successful";
    public static final String MSG_LOGOUT_ALL_SUCCESS = "Logged out %d devices";
    public static final String MSG_LOGOUT_TOKEN_INVALID = "Token does not exist or has expired";
    public static final String MSG_LOGOUT_NO_SESSION = "No devices are logged in";

    public static final String REPORT_NOTIFICATION_KEY = "report:notification:%d";
    public static final Long REPORT_NOTIFICATION_TTL_DAYS = 30L;

    public static final int NORMAL_LIMIT = 20;
    public static final int ACTIVE_FOLLOW_MIN = 5;
    public static final int ACTIVE_WINDOW_HOURS = 1;
    public static final int FEATURED_SCORE_MIN = 80;
    public static final int FEATURED_LIMIT_MIN = 1;
    public static final int FEATURED_LIMIT_MAX = 3;
    public static final int FEATURED_EXPIRE_MIN_HOURS = 24;

    // number of mutual friends
    public static final int MAX_MUTUAL_FRIENDS = 5;
    public static final int SCORE_PER_MUTUAL_FRIEND = 5;

    // infomation badge
    public static final String INFOMATION_CREATE_BADGE_CONFIG = "Badge config created successfully";
    public static final String INFOMATION_UPDATE_BADGE_CONFIG = "Badge config updated successfully";
    public static final String INFOMATION_UPDATE_BADGE_VIDEO_LIMIT = "Badge video limit updated successfully";
    public static final String INFOMATION_GRANT_RED_TICK = "Red tick granted successfully";
    public static final String INFOMATION_GRANT_RED_TICK_BATCH = "Red tick batch granted successfully";
    public static final String INFOMATION_EVALUATE_USER = "Badge evaluation triggered";

}
