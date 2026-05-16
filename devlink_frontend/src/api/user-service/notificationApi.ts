// src/api/user-service/notificationApi.ts
import axiosInstance from '../axiosInstance';
import type { NotificationPageResponse, NotificationResponse } from '../../types/notification.types';

export const notificationApi = {
    // Đếm số thông báo chưa đọcm dùng cho badge icon chuông
    getUnreadCount: () =>
        axiosInstance.get<{ data: number }>('/api/users/notifications/unread-count'),

    // Lấy tất cả notification, phân trang, mới nhất lên đầu
    getNotifications: (page = 0, size = 20) =>
        axiosInstance.get<{ data: NotificationPageResponse }>('/api/users/notifications', {
            params: { page, size },
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
};