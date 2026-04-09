package com.devlink.gateway_service.util;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum GatewayErrorCode {
    MISSING_AUTH_HEADER(401, "AUTHORIZATION_HEADER_MISSING", "Missing Authorization header"),
    INVALID_TOKEN(401, "TOKEN_INVALID_OR_EXPIRED", "Invalid or expired token"),
    INVALID_TOKEN_DATA(401, "TOKEN_DATA_INVALID", "Invalid token data");
    private final int httpStatus;
    private final String code;
    private final String message;
}
