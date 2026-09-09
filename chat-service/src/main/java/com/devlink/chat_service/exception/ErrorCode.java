package com.devlink.chat_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    ALREADY_FOLLOWED("You are already following this user", HttpStatus.BAD_REQUEST),
    CONVERSATION_NOT_FOUND("Conversation not found", HttpStatus.NOT_FOUND),
    CONVERSATION_ALREADY_EXISTS("Direct conversation already exists", HttpStatus.CONFLICT),
    NOT_A_MEMBER("You are not a member of this conversation", HttpStatus.FORBIDDEN),
    USER_BLOCKED("Cannot send message: you have been blocked or you blocked this user", HttpStatus.FORBIDDEN),
    CANNOT_CHAT_WITH_THIS_USER("You can only chat with friends or followers", HttpStatus.FORBIDDEN),
    RECEIVER_NOT_FOUND("Receiver user not found", HttpStatus.NOT_FOUND),
    MESSAGE_NOT_FOUND("Message not found", HttpStatus.NOT_FOUND),
    ONLY_SENDER_CAN_RECALL("Only the sender can recall this message", HttpStatus.FORBIDDEN),
    MESSAGE_ALREADY_RECALLED("Message has already been recalled", HttpStatus.BAD_REQUEST),
    MESSAGE_ALREADY_DELETED_BY_YOU("You cannot recall a message that you have already deleted on your side", HttpStatus.BAD_REQUEST),
    RECALL_TIME_EXPIRED("Cannot recall a message after 1 hour of sending", HttpStatus.BAD_REQUEST);
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String message, HttpStatus httpStatus) {
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
