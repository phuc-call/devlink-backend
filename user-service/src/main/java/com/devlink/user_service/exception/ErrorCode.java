package com.devlink.user_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    EMAIL_ALREADY_EXISTS("Email already exists", HttpStatus.CONFLICT),
    NOT_FOLLOWED("You are not following this user", HttpStatus.BAD_REQUEST),
    ALREADY_FOLLOWED("You are already following this user", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_ROLE_FOR_BADGE("Insufficient role to grant this badge", HttpStatus.FORBIDDEN),
    CANNOT_FOLLOW_YOURSELF("You cannot follow yourself", HttpStatus.BAD_REQUEST),
    CANNOT_BLOCK_YOURSELF("You cannot block yourself", HttpStatus.BAD_REQUEST),
    USERNAME_ALREADY_EXISTS("Username already exists", HttpStatus.CONFLICT),
    USER_NOT_FOUND("User not found", HttpStatus.NOT_FOUND),
    NOTIFICATION_NOT_FOUND("User not found", HttpStatus.NOT_FOUND),
    EMAIL_TEMPLATE_NOT_FOUND("Email template not found", HttpStatus.NOT_FOUND),
    ROLE_NOT_FOUND("Role configuration error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_OAUTH2_MODE("Invalid OAuth2 mode", HttpStatus.BAD_REQUEST),
    INVALID_OTP("Invalid OTP code", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED("OTP has expired, please request a new one", HttpStatus.BAD_REQUEST),
    OTP_RATE_LIMIT_EXCEEDED("Too many OTP requests, please try again later", HttpStatus.TOO_MANY_REQUESTS),
    INVALID_OAUTH2_TOKEN("Invalid OAuth2 token", HttpStatus.UNAUTHORIZED),
    EMAIL_NOT_VERIFIED("Email has not been verified", HttpStatus.FORBIDDEN),
    BADGE_ALREADY_GRANTED("Badge has already been granted", HttpStatus.CONFLICT),
    ALREADY_BLOCKED("User is already blocked", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("Invalid email or password", HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED("Account is temporarily locked, please try again later", HttpStatus.FORBIDDEN),
    NOT_BLOCKED("User is not blocked", HttpStatus.BAD_REQUEST),
    VISIBILITY_NOT_FOUND("Not found visibility",HttpStatus.NOT_FOUND),
    USER_BLOCKED("You have been blocked by this user", HttpStatus.FORBIDDEN),
    INVALID_REFRESH_TOKEN("Refresh token is invalid or expired", HttpStatus.UNAUTHORIZED);

    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String message, HttpStatus httpStatus) {
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
