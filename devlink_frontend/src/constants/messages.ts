/**
 * UI message constants — toast messages, error messages, success messages.
 * Tập trung mọi text hiển thị cho người dùng để dễ thay đổi.
 */

/** Auth-related messages */
export const AUTH_MESSAGES = {
  PASSWORD_MISMATCH: 'Mật khẩu xác nhận không khớp',
  CHANGE_PASSWORD_SUCCESS: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.',
  CHANGE_PASSWORD_SUCCESS_FORGOT: 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.',
  ERROR_RETRY: 'Có lỗi xảy ra, vui lòng thử lại.',
  OTP_SEND_FAILED: 'Gửi OTP thất bại',
  OTP_EXPIRED: 'Mã OTP đã hết hạn, vui lòng gửi lại.',
  OTP_SENT: 'Mã OTP đã được gửi đến email của bạn.',
  EMAIL_SEND_FAILED: 'Không thể gửi email. Vui lòng kiểm tra lại.',
  LOGIN_FAILED: 'Đăng nhập thất bại',
  ACCOUNT_LOCKED: 'Tài khoản đã bị khóa tạm thời do đăng nhập sai nhiều lần',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
} as const;

/** Chat-related messages */
export const CHAT_MESSAGES = {
  SENT_FILE_FALLBACK: 'Sent a file/image',
  RECALLED: 'Tin nhắn đã bị thu hồi',
  SYSTEM_MESSAGE: 'System message',
  MESSAGE_UNSENT: 'Message unsent',
  RECALL_FAILED: 'Failed to recall message',
  UNPIN_FAILED: 'Failed to unpin message',
  SEARCH_FAILED: 'Failed to search messages',
  SEND_FAILED_LABEL: 'Gửi thất bại',
  BLOCKED_WARNING: 'Bạn hoặc người dùng này đã chặn nhau. Không thể gửi tin nhắn.',
} as const;

/** Profile-related messages */
export const PROFILE_MESSAGES = {
  UPDATE_SUCCESS: 'Cập nhật thành công!',
  ERROR_GENERIC: 'Có lỗi xảy ra, thử lại!',
} as const;

/** Group-related messages */
export const GROUP_MESSAGES = {
  NOT_FOUND: 'Không tìm thấy thông tin nhóm.',
  LEAVE_SUCCESS: 'Rời nhóm thành công',
  UPDATE_SUCCESS: 'Cập nhật nhóm thành công',
  INVITE_CREATED: 'Đã tạo mã mời',
  JOIN_REQUEST_SENT: 'Đã gửi yêu cầu tham gia',
  ALREADY_MEMBER: 'Bạn đã ở trong nhóm này',
  COVER_UPDATING: 'Đang tải ảnh lên...',
  COVER_UPDATED: 'Cập nhật ảnh bìa thành công!',
  MEMBER_REMOVED: 'Đã loại thành viên khỏi nhóm',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  COPIED: 'Đã copy',
  LOAD_MEMBERS_ERROR: 'Lỗi khi tải thành viên',
  LOAD_PENDING_ERROR: 'Lỗi khi tải danh sách chờ',
  REPORT_IN_DEV: 'Tính năng Tố cáo nhóm đang phát triển',
} as const;

/** Post / template messages */
export const POST_MESSAGES = {
  PROCESSING: 'Bài viết đang được xử lý và sẽ sớm hiển thị...',
  CREATE_SUCCESS: 'Đăng bài thành công!',
  CREATE_FAILED_PREFIX: 'Lỗi đăng bài: ',
} as const;
