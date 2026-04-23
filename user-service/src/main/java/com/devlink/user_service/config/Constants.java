package com.devlink.user_service.config;

public final class Constants {
    private Constants() {
    }

    public static final String[] PUBLIC_ENDPOINT = {
            "/auth/**",
            "/oauth2/**",
            "/v3/api-docs",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };
    public static final String PAGE_NUMBER = "0";
    public static final String PAGE_SIZE = "2";
    public static final String SORT_DIR = "asc";
    public static final int OPS_EXPIRATION_MINUTES = 5;

    public static final String MSG_LOGOUT_SUCCESS        = "Logout successful";
    public static final String MSG_LOGOUT_ALL_SUCCESS    = "Logged out %d devices";
    public static final String MSG_LOGOUT_TOKEN_INVALID  = "Token does not exist or has expired";
    public static final String MSG_LOGOUT_NO_SESSION     = "No devices are logged in";
}
