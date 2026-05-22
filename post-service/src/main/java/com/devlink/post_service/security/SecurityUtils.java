package com.devlink.post_service.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    private SecurityUtils() {}

    public static Long getCurrentUserId() {
        return getPrincipal().getId();
    }

    public static String getCurrentUserEmail() {
        return getPrincipal().getEmail();
    }

    public static String getCurrentUserRole() {
        return getPrincipal().getRole();
    }

    // Dùng khi cần check thủ công trong service
    public static boolean isAdmin() {
        return "ADMIN".equals(getCurrentUserRole());
    }

    private static AuthUserDetails getPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthUserDetails)) {
            throw new IllegalStateException("No authenticated user found");
        }
        return (AuthUserDetails) auth.getPrincipal();
    }
}