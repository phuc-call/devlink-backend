package com.devlink.gateway_service.util;

import lombok.Getter;


@Getter
public final class HeaderConstants {
    public static final String USER_ID    = "X-User-Id";
    public static final String USER_ROLE  = "X-User-Role";
    public static final String USER_EMAIL = "X-User-Email";
    private HeaderConstants(){}
}
