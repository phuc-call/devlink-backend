// src/api/user-service/notificationApi.ts
import axiosInstance from '../axiosInstance';
import type {
    NotificationPageResponse, NotificationResponse, NotificationActionRequest,
    NotificationPasswordSetupRequest
} from '../../types/notification.types';

export const notificationApi = {
    // Đếm số thông báo chưa đọcm dùng cho badge icon chuông
    getUnreadCount: () =>
        axiosInstance.get<{ data: number }>('/api/users/notifications/unread-count', {
            params: {count: 'COUNT_SHOW_NOTIFICATION'},
        }),

    getUnreadCountHidden: () =>
        axiosInstance.get<{ data: number }>('/api/users/notifications/unread-count', {
            params: {count: 'COUNT_HIDDEN_NOTIFICATION'},
        }),

    // Lấy tất cả notification, phân trang, mới nhất lên đầu
    getNotifications: (page = 0, size = 20) =>
        axiosInstance.get<{ data: NotificationPageResponse }>('/api/users/notifications', {
            params: {page, size},
        }),

    // Bấm vào 1 thông báo đánh dấu đã đọc
    markAsRead: (id: number) =>
        axiosInstance.patch<{ data: null }>(`/api/users/notifications/${id}/read`),

    // Đánh dấu tất cả đã đọc
    markAllAsRead: () =>
        axiosInstance.patch<{ data: null }>('/api/users/notifications/read-all'),

    // Sinh nhật bạn bè trong 7 ngày gần đây
    getBirthdayNotifications: () =>
        axiosInstance.get<{ data: NotificationResponse[] }>('/api/users/notifications/birthday'),

    handleAction: (request: NotificationActionRequest) =>
        axiosInstance.post<{ data: null }>('/api/users/notifications/action', request),

    // Bước 1: Gửi OTP về email
    setupNotificationPassword: () =>
        axiosInstance.post<{ data: null }>('/api/users/notifications/password/setup'),

    // Bước 2: Verify OTP + lưu password 4 số
    verifyOtpAndSetPassword: (request: NotificationPasswordSetupRequest) =>
        axiosInstance.post<{ data: null }>('/api/users/notifications/password/verify', request),

    // Kiểm tra user đã set password notification chưa
    hasNotificationPassword: () =>
        axiosInstance.get<{ data: boolean }>('/api/users/notifications/password-notification'),

// Verify password — dùng VERIFY_PASSWORD action
    checkPassword: (passWord: string) =>
        axiosInstance.post<{ data: null }>('/api/users/notifications/action', {
            action: 'VERIFY_PASSWORD',
            passWord,
        }),
};