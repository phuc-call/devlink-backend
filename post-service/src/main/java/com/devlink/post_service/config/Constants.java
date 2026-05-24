package com.devlink.post_service.config;

public final class Constants {
    private Constants() {
    }

    public static final String[] PUBLIC_ENDPOINT = {
            "/v3/api-docs",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/webjars/**",
            "/actuator/**",
            "/api/posts/public/**"
    };

    public static final String PAGE_NUMBER = "0";
    public static final String PAGE_SIZE = "2";
    public static final String SORT_DIR = "asc";
    public static final int OPS_EXPIRATION_MINUTES = 5;

    public static final long MAX_SIZE_BYTES       = 50L * 1024 * 1024;  // 50MB each file
    public static final long MAX_TOTAL_SIZE_BYTES = 200L * 1024 * 1024; // 200MB sum
    public static final int  MAX_FILE_COUNT       = 10; // tối đa 10 file

}
