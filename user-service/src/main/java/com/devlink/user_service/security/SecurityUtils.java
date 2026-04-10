package com.devlink.user_service.security;

import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    private SecurityUtils() {}

    public static Long getCurrentUserId() {
        AuthUserDetails principal = (AuthUserDetails) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return principal.getId();
    }

    public static String getCurrentUserEmail() {
        AuthUserDetails principal = (AuthUserDetails) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return principal.getEmail();
    }

    public static String getCurrentUserRole() {
        AuthUserDetails principal = (AuthUserDetails) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return principal.getRole();
    }
}