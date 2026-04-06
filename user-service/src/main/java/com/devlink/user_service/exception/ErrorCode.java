package com.devlink.user_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    EMAIL_ALREADY_EXISTS   ("EMAIL_ALREADY_EXISTS",    HttpStatus.CONFLICT),
    USERNAME_ALREADY_EXISTS("USERNAME_ALREADY_EXISTS", HttpStatus.CONFLICT),
    USER_NOT_FOUND         ("USER_NOT_FOUND",          HttpStatus.NOT_FOUND),
    ROLE_NOT_FOUND         ("ROLE_NOT_FOUND",          HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_OAUTH2_MODE    ("INVALID_OAUTH2_MODE",     HttpStatus.BAD_REQUEST),
    INVALID_OAUTH2_TOKEN   ("INVALID_OAUTH2_TOKEN",    HttpStatus.UNAUTHORIZED),
    EMAIL_NOT_VERIFIED     ("EMAIL_NOT_VERIFIED",      HttpStatus.FORBIDDEN),
    INVALID_REFRESH_TOKEN  ("INVALID_REFRESH_TOKEN",   HttpStatus.UNAUTHORIZED);

    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String message, HttpStatus httpStatus) {
        this.message   = message;
        this.httpStatus = httpStatus;
    }

}
