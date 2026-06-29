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
    NOTIFICATION_NOT_FOUND("Notification not found", HttpStatus.NOT_FOUND),
    EMAIL_TEMPLATE_NOT_FOUND("Email template not found", HttpStatus.NOT_FOUND),
    ROLE_NOT_FOUND("Role configuration error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_OAUTH2_MODE("Invalid OAuth2 mode", HttpStatus.BAD_REQUEST),
    INVALID_OTP("Invalid OTP code", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED("OTP has expired, please request a new one", HttpStatus.BAD_REQUEST),
    OTP_RATE_LIMIT_EXCEEDED("Too many OTP requests, please try again later", HttpStatus.TOO_MANY_REQUESTS),
    INVALID_OAUTH2_TOKEN("Invalid OAuth2 token", HttpStatus.UNAUTHORIZED),

    FORBIDDEN("Access denied", HttpStatus.FORBIDDEN), EMAIL_NOT_VERIFIED("Email has not been verified", HttpStatus.FORBIDDEN),
    BADGE_ALREADY_GRANTED("Badge has already been granted", HttpStatus.CONFLICT),
    ALREADY_BLOCKED("User is already blocked", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("Invalid email or password", HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED("Account is temporarily locked, please try again later", HttpStatus.FORBIDDEN),
    NOT_BLOCKED("User is not blocked", HttpStatus.BAD_REQUEST),
    VISIBILITY_NOT_FOUND("Not found visibility", HttpStatus.NOT_FOUND),
    USER_BLOCKED("You have been blocked by this user", HttpStatus.FORBIDDEN),
    NOT_HAVE_ANY_FRIEND("Cat not find your frieds", HttpStatus.NOT_FOUND),
    INVALID_REFRESH_TOKEN("Refresh token is invalid or expired", HttpStatus.UNAUTHORIZED),
    NOTIFICATION_PASSWORD_NOT_SET("Notification password has not been set", HttpStatus.BAD_REQUEST),
    NOTIFICATION_PASSWORD_ALREADY_SET("Notification password has been set", HttpStatus.BAD_REQUEST),
    NOTIFICATION_PASSWORD_WRONG("Notification password is incorrect", HttpStatus.BAD_REQUEST),
    NOTIFICATION_PASSWORD_INVALID("Notification password must be 4 digits", HttpStatus.BAD_REQUEST),
    NOTIFICATION_ALREADY_HIDDEN("Notification has already been hidden", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED("File is invalid, please try again", HttpStatus.BAD_REQUEST),
    GET_AVATAR_FAILED("Avatar cat not get beaces it save", HttpStatus.BAD_REQUEST),
    NOTIFICATION_NOT_HIDDEN("Notification has not been hidden", HttpStatus.BAD_REQUEST),
    IMAGE_NOT_FOUND("Image not found", HttpStatus.NOT_FOUND),
    INVALID_INVITE_CODE("Invalid invite code", HttpStatus.BAD_REQUEST),
    NO_PERMISSION("You do not have permission to view this", HttpStatus.FORBIDDEN);

    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String message, HttpStatus httpStatus) {
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
