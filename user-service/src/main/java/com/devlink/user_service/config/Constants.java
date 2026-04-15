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



}
