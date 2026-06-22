package com.devlink.post_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    POST_CONTENT_EMPTY("Post must have content or at least one attachment", HttpStatus.BAD_REQUEST),

    POST_FILE_REQUIRED("FILE type post must have at least one attachment", HttpStatus.BAD_REQUEST),

    POST_FILE_TOO_LARGE("File exceeds the 50MB limit", HttpStatus.BAD_REQUEST),

    FILE_UPLOAD_FAILED("File is invalid, please try again", HttpStatus.BAD_REQUEST),

    POST_FILE_UNSUPPORTED_FORMAT("File format is not supported", HttpStatus.BAD_REQUEST),

    POST_ACCOUNT_RESTRICTED("Your account has been restricted from posting", HttpStatus.FORBIDDEN),

    POST_NOT_FOUND("Post not found", HttpStatus.NOT_FOUND),

    COMMENT_NOT_FOUND("Comment not found", HttpStatus.NOT_FOUND),

    FORBIDDEN("You do not have permission to perform this action", HttpStatus.FORBIDDEN),

    POST_ALREADY_DELETED("Post has already been deleted", HttpStatus.BAD_REQUEST),

    POST_FORBIDDEN("You do not have permission to perform this action", HttpStatus.FORBIDDEN),

    AI_SERVICE_UNAVAILABLE("AI service is temporarily unavailable, please try again later", HttpStatus.SERVICE_UNAVAILABLE),

    POST_FILE_EMPTY("File must not be empty", HttpStatus.BAD_REQUEST),

    INVALID_POST_TYPE("Invalid post type", HttpStatus.BAD_REQUEST),

    POST_TOO_MANY_FILES("Maximum 10 files per post", HttpStatus.BAD_REQUEST),

    TEMPLATE_NOT_FOUND("Template not found", HttpStatus.NOT_FOUND),

    INVALID_TEMPLATE_TYPE("This type has already been processed", HttpStatus.BAD_REQUEST),

    TEMPLATE_LANGUAGE_NOT_SUPPORTED("Programming language is not supported", HttpStatus.BAD_REQUEST),

    TEMPLATE_FILE_TYPE_MISMATCH("File type does not match the actual file format", HttpStatus.BAD_REQUEST),

    TEMPLATE_FILE_TOO_LARGE("Template file exceeds the 100MB limit", HttpStatus.BAD_REQUEST),

    TEMPLATE_FORK_NOT_FOUND("Fork not found", HttpStatus.NOT_FOUND),

    FORK_NOT_ALLOWED("Video files are not accepted", HttpStatus.NOT_FOUND),

    TEMPLATE_FORK_NOT_OWNER("You do not have permission to edit this fork", HttpStatus.FORBIDDEN),

    TEMPLATE_VIDEO_CANNOT_FORK("VIDEO files cannot be forked", HttpStatus.BAD_REQUEST),

    TEMPLATE_TOO_MANY_PENDING_SUGGESTIONS("You already have 3 pending suggestions for this template", HttpStatus.TOO_MANY_REQUESTS),

    TEMPLATE_SUGGESTION_NOT_FOUND("Suggestion not found", HttpStatus.NOT_FOUND), TEMPLATE_FORK_NO_CHANGES("Fork has no modifications to suggest", HttpStatus.BAD_REQUEST),

    TEMPLATE_SUGGESTION_ALREADY_REVIEWED("This suggestion has already been reviewed", HttpStatus.BAD_REQUEST),

    POST_FILE_TOTAL_SIZE_EXCEEDED("Total file size must not exceed 200MB", HttpStatus.BAD_REQUEST),

    PARENT_COMMENT_NOT_FOUND("Parent comment does not exist in this post", HttpStatus.BAD_REQUEST),

    COMMENT_GLOBALLY_LOCKED("Your account has been banned from commenting", HttpStatus.FORBIDDEN),

    COMMENT_POST_LOCKED("This post has been locked for commenting on your account", HttpStatus.FORBIDDEN),

    CONTENT_REJECTED_BY_AI("Comment content violates community standards", HttpStatus.BAD_REQUEST),

    POST_COMMENT_COUNT_UPDATE_FAILED("Failed to update comment count", HttpStatus.BAD_REQUEST),

    POST_NOT_YOURSELF("You can only delete your own posts", HttpStatus.BAD_REQUEST),

    INVALID_DATE_RANGE("Invalid date range: start date must be before end date and follow the correct format (yyyy-MM-dd)", HttpStatus.BAD_REQUEST),
    SUGGESTION_ALREADY_PROCESSED("The suggestion has already been processed.", HttpStatus.BAD_REQUEST),
    SUGGESTION_CANNOT_CANCEL("Cannot cancel a suggestion that has already been processed.", HttpStatus.BAD_REQUEST),
    REJECT_REASON_REQUIRED("Rejection reason is required and must not exceed 500 characters.", HttpStatus.BAD_REQUEST),
    // Saved post
    POST_ALREADY_SAVED("Post already saved", HttpStatus.CONFLICT),
    POST_NOT_SAVED("Post not in saved list", HttpStatus.NOT_FOUND),
    POST_SAVE_NOT_ALLOWED("You are not allowed to save this post", HttpStatus.FORBIDDEN),
    POST_UNAVAILABLE("Post is no longer available", HttpStatus.GONE),
    POST_VIOLATED("Post has been removed due to a policy violation", HttpStatus.UNAVAILABLE_FOR_LEGAL_REASONS),
    ACCESS_DENIED("You do not have permission to perform this action.", HttpStatus.FORBIDDEN),
    REPORT_ALREADY_SUBMITTED( "You have already reported this content and it is pending review", HttpStatus.CONFLICT),
    TARGET_NOT_FOUND("Reported target does not exist", HttpStatus.NOT_FOUND),

    //Report
    REPORT_NOT_FOUND("Report not found",HttpStatus.NOT_FOUND),
    REPORT_ALREADY_REVIEWED( "Report has already been reviewed",HttpStatus.CONFLICT),
    RESTRICTION_TIME_REQUIRED( "Restriction time is required",HttpStatus.BAD_REQUEST),
    RESTRICTION_TIME_IN_PAST("Restriction time must be in the future",HttpStatus.BAD_REQUEST),
    REPORT_CANNOT_DELETE("Only RESOLVED or REJECTED reports can be deleted", HttpStatus.BAD_REQUEST),
    RESTRICTION_TIME_TOO_LONG( "Restriction time cannot exceed 7 days",HttpStatus.BAD_REQUEST),

    //badge
    VIDEO_DURATION_EXCEEDED("Video duration exceeds your badge limit", HttpStatus.BAD_REQUEST),
    VIDEO_DAILY_LIMIT_EXCEEDED("Daily video upload limit reached", HttpStatus.BAD_REQUEST),
    VIDEO_LIMIT_CONFIG_NOT_FOUND("Video limit config not found", HttpStatus.SERVICE_UNAVAILABLE);

    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String message, HttpStatus httpStatus) {
        this.message = message;
        this.httpStatus = httpStatus;
    }
}