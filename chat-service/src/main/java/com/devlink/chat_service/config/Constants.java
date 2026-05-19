package com.devlink.chat_service.config;

public final class Constants {
    private Constants() {
    }

    public static final String[] PUBLIC_ENDPOINT = {

            "/v3/api-docs",

            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",

            "/post-service/v3/api-docs/**"
    };

    public static final String PAGE_NUMBER = "0";
    public static final String PAGE_SIZE = "2";
    public static final String SORT_DIR = "asc";
    public static final int OPS_EXPIRATION_MINUTES = 5;

}
