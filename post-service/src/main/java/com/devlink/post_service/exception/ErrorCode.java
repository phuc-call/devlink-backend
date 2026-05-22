package com.devlink.post_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    POST_CONTENT_EMPTY(
            "Bài viết phải có nội dung hoặc file đính kèm",
            HttpStatus.BAD_REQUEST),

    POST_FILE_REQUIRED(
            "Bài viết kiểu FILE phải đính kèm ít nhất 1 file",
            HttpStatus.BAD_REQUEST),

    POST_FILE_TOO_LARGE(
            "File vượt quá giới hạn 50MB",
            HttpStatus.BAD_REQUEST),

    POST_FILE_UNSUPPORTED_FORMAT(
            "Định dạng file không được hỗ trợ",
            HttpStatus.BAD_REQUEST),

    POST_ACCOUNT_RESTRICTED(
            "Tài khoản của bạn đang bị hạn chế đăng bài",
            HttpStatus.FORBIDDEN),

    POST_NOT_FOUND(
            "Không tìm thấy bài viết",
            HttpStatus.NOT_FOUND),

    POST_ALREADY_DELETED(
            "Bài viết đã bị xoá",
            HttpStatus.BAD_REQUEST),

    POST_FORBIDDEN(
            "Bạn không có quyền thực hiện thao tác này",
            HttpStatus.FORBIDDEN),

    AI_SERVICE_UNAVAILABLE(
            "Dịch vụ AI tạm thời không khả dụng, vui lòng thử lại sau",
            HttpStatus.SERVICE_UNAVAILABLE),
    POST_FILE_EMPTY(
    "File không được rỗng",
    HttpStatus.BAD_REQUEST),

    POST_TOO_MANY_FILES(
    "Tối đa 10 file mỗi bài viết",
    HttpStatus.BAD_REQUEST),

    POST_FILE_TOTAL_SIZE_EXCEEDED(
    "Tổng dung lượng file không được vượt quá 200MB",
    HttpStatus.BAD_REQUEST);

    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String message, HttpStatus httpStatus) {
        this.message = message;
        this.httpStatus = httpStatus;
    }
}