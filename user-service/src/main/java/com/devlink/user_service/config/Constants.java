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
            "/internal/**",
            "/user-service/v3/api-docs/**"
    };
    public static final Long SYSTEM_ACTOR_ID = 0L;

    public static final int OPS_EXPIRATION_MINUTES = 5;

    public static final String MSG_LOGOUT_SUCCESS = "Logout successful";
    public static final String MSG_LOGOUT_ALL_SUCCESS = "Logged out %d devices";
    public static final String MSG_LOGOUT_TOKEN_INVALID = "Token does not exist or has expired";
    public static final String MSG_LOGOUT_NO_SESSION = "No devices are logged in";

    public static final String REPORT_NOTIFICATION_KEY="report:notification:%d";
    public static final Long REPORT_NOTIFICATION_TTL_DAYS=30L;

}
