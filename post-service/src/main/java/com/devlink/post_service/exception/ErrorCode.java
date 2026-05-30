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

    FILE_UPLOAD_FAILED(
            "File hiện tại không hợp lệ vui lòng thử lại sao",
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
    COMMENT_NOT_FOUND(
            "Không tìm thấy bình luận",
            HttpStatus.NOT_FOUND),
    FORBIDDEN(
            "Bạn không có quyền thực hiện thao tác này",
            HttpStatus.FORBIDDEN),

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

    INVALID_POST_TYPE(
            "Loại bài viết không hợp lệ",
            HttpStatus.BAD_REQUEST),

    POST_TOO_MANY_FILES(
    "Tối đa 10 file mỗi bài viết",
    HttpStatus.BAD_REQUEST),



    TEMPLATE_NOT_FOUND(
            "Không tìm thấy template",
            HttpStatus.NOT_FOUND),

    TEMPLATE_LANGUAGE_NOT_SUPPORTED(
            "Ngôn ngữ lập trình không được hỗ trợ",
            HttpStatus.BAD_REQUEST),

    TEMPLATE_FILE_TYPE_MISMATCH(
            "Loại file không khớp với định dạng file thực tế",
            HttpStatus.BAD_REQUEST),

    TEMPLATE_FILE_TOO_LARGE(
            "File template vượt quá giới hạn 100MB",
            HttpStatus.BAD_REQUEST),

    TEMPLATE_FORK_NOT_FOUND(
            "Không tìm thấy bản fork",
            HttpStatus.NOT_FOUND),

    TEMPLATE_FORK_NOT_OWNER(
            "Bạn không có quyền chỉnh sửa bản fork này",
            HttpStatus.FORBIDDEN),

    TEMPLATE_VIDEO_CANNOT_FORK(
            "File VIDEO không thể fork",
            HttpStatus.BAD_REQUEST),

    TEMPLATE_TOO_MANY_PENDING_SUGGESTIONS(
            "Bạn đã có 3 đề xuất đang chờ duyệt cho template này",
            HttpStatus.TOO_MANY_REQUESTS),

    TEMPLATE_SUGGESTION_NOT_FOUND(
            "Không tìm thấy đề xuất",
            HttpStatus.NOT_FOUND),

    TEMPLATE_SUGGESTION_ALREADY_REVIEWED(
            "Đề xuất này đã được xử lý rồi",
            HttpStatus.BAD_REQUEST),


    POST_FILE_TOTAL_SIZE_EXCEEDED(
    "Tổng dung lượng file không được vượt quá 200MB",
    HttpStatus.BAD_REQUEST),

    PARENT_COMMENT_NOT_FOUND( "Comment cha không tồn tại trong bài viết này", HttpStatus.BAD_REQUEST),
    COMMENT_GLOBALLY_LOCKED("Tài khoản của bạn đang bị khóa chức năng bình luận", HttpStatus.FORBIDDEN),
    COMMENT_POST_LOCKED("Bài viết này đang bị khóa bình luận với tài khoản của bạn", HttpStatus.FORBIDDEN),
    CONTENT_REJECTED_BY_AI("Nội dung bình luận vi phạm tiêu chuẩn cộng đồng", HttpStatus.BAD_REQUEST),


    POST_COMMENT_COUNT_UPDATE_FAILED(  "Cập nhật số lượng comment thất bại",HttpStatus.BAD_REQUEST),
    POST_NOT_YOURSELF(
    "Chỉ dược xóa bài viết của bạn",
    HttpStatus.BAD_REQUEST);



    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String message, HttpStatus httpStatus) {
        this.message = message;
        this.httpStatus = httpStatus;
    }

}