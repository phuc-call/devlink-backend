import axios from 'axios';
import { STORAGE_KEYS, STORAGE_VALUES } from '../constants/storage';
import { ROUTES } from '../constants/routes';
import { db } from '../utils/db';
import { clearAllLocalData } from '../utils/auth';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_GATEWAY_URL,
    withCredentials: true, // Bật gửi cookie tự động
});

// Không cần gán Authorization header bằng tay nữa vì trình duyệt tự gửi cookie!
axiosInstance.interceptors.request.use(async config => {
    // Không check token cho request refresh hoặc logout
    if (config.url?.includes('/auth/refresh') || config.url?.includes('/auth/logout')) {
        return config;
    }

    const expStr = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXP);
    if (expStr && localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === STORAGE_VALUES.LOGGED_IN_TRUE) {
        const exp = parseInt(expStr, 10);
        const currentTime = Date.now();
        // Cập nhật token nếu cần dưới 1 phút (60000ms) là hết hạn
        if (currentTime >= exp - 60000) {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const res = await axios.post(
                        '/auth/refresh',
                        {},
                        {
                            baseURL: import.meta.env.VITE_API_GATEWAY_URL,
                            withCredentials: true
                        }
                    );

                    const newAccessToken = res.data?.data?.accessToken;
                    if (newAccessToken) {
                        const newExp = getJwtExp(newAccessToken);
                        if (newExp) {
                            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXP, newExp.toString());
                        }
                    } else {
                        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXP, (Date.now() + 15 * 60 * 1000).toString());
                    }

                    processQueue(null, null);
                } catch (err) {
                    processQueue(err, null);
                    await clearAllLocalData();
                    window.location.href = ROUTES.LOGIN;
                    return Promise.reject(err);
                } finally {
                    isRefreshing = false;
                }
            } else {
                // Đang refresh thì đợi
                await new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                });
            }
        }
    }

    return config;
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const getJwtExp = (token: string): number | null => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp ? payload.exp * 1000 : null;
    } catch (e) {
        return null;
    }
};

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    res => res,
    async error => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                // Đợi request refresh token đầu tiên hoàn thành
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    // Trình duyệt sẽ tự gán Cookie mới vào đây
                    return axiosInstance(original);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            original._retry = true;
            // Không cần lấy refreshToken từ localStorage nữa, cookie tự gửi đi!
            isRefreshing = true;

            try {
                const res = await axios.post(
                    '/auth/refresh',
                    {}, // Body trống
                    {
                        baseURL: import.meta.env.VITE_API_GATEWAY_URL,
                        withCredentials: true
                    } // Bắt buộc để gửi cookie
                );

                const newAccessToken = res.data?.data?.accessToken;
                if (newAccessToken) {
                    const newExp = getJwtExp(newAccessToken);
                    if (newExp) {
                        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXP, newExp.toString());
                    }
                } else {
                    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXP, (Date.now() + 15 * 60 * 1000).toString());
                }

                // Backend đã tự set lại cookie mới, ta không cần làm gì với localStorage
                processQueue(null, null);
                return axiosInstance(original);
            } catch (err) {
                console.log('Refresh thất bại:', err);
                processQueue(err, null);
                // Xóa flag auth để tránh redirect loop
                await clearAllLocalData();
                window.location.href = ROUTES.LOGIN;
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;