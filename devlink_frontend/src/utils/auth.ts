import { STORAGE_KEYS, STORAGE_VALUES } from '../constants/storage';
import { ROLES } from '../constants/roles';
import axiosInstance from '../api/axiosInstance';
import { db } from './db';
export function getCurrentUserId(): number | null {
    const id = localStorage.getItem(STORAGE_KEYS.USER_ID);
    return id ? Number(id) : null;
}

export function getCurrentUserRole(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ROLE);
}

export function isAdmin(): boolean {
    return getCurrentUserRole() === ROLES.ADMIN;
}

export async function getCurrentUserInfo(): Promise<{ userName: string; avatar: string | null } | null> {
    const id = getCurrentUserId();
    if (!id) return null;
    try {
        const res = await axiosInstance.get(`/api/users/${id}/name`);
        return res.data?.data ?? null;
    } catch {
        return null;
    }
}

export async function getUserInfoById(
    userId: number
): Promise<{ userName: string; avatar: string | null } | null> {
    try {
        const res = await axiosInstance.get(`/api/users/${userId}/name`);
        return res.data?.data ?? null;
    } catch {
        return null;
    }
}

/** Kiểm tra user đang đăng nhập hay không */
export function isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === STORAGE_VALUES.LOGGED_IN_TRUE;
}

/** Tự động xóa sạch toàn bộ data liên quan đến User lúc đăng xuất */
export async function clearAllLocalData(): Promise<void> {
    // 1. Clear IndexedDB Data (Fix 403 Forbidden on chatting with old DB)
    try {
        await Promise.all([
            db.messages.clear(),
            db.conversations.clear(),
            db.pinnedMessages.clear(),
            db.conversationConfigs.clear()
        ]);
    } catch (err) {
        console.error("Failed to clear local db on logout", err);
    }

    // 2. Phá hủy toàn bộ cache Token trong LocalStorage
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AVATAR);
    localStorage.removeItem(STORAGE_KEYS.FULL_NAME);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // 3. Clear toàn bộ Cookies (Nếu có lưu trong Cookie)
    try {
        document.cookie.split(";").forEach((c) => {
            const cookieName = c.replace(/^ +/, "").split("=")[0];
            document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
        });
    } catch (err) {
        console.error("Failed to clear cookies on logout", err);
    }
}
