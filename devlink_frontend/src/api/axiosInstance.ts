import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_GATEWAY_URL,
    withCredentials: true, // Bật gửi cookie tự động
});

// Không cần gán Authorization header bằng tay nữa vì trình duyệt tự gửi cookie!
axiosInstance.interceptors.request.use(config => {
    return config;
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

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

        console.log('🔴 Request lỗi:', error.config?.url, 'Status:', error.response?.status);

        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                // Đợi request refresh token đầu tiên hoàn thành
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    // Trình duyệt sẽ tự gắn Cookie mới vào đây
                    return axiosInstance(original);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            // Không cần lấy refreshToken từ localStorage nữa, cookie tự gửi đi!
            isRefreshing = true;

            try {
                console.log('🔄 Đang gọi refresh tại:', `${import.meta.env.VITE_API_GATEWAY_URL}/auth/refresh`);
                
                // Trình duyệt sẽ tự đính kèm cookie refreshToken vào request này
                const res = await axios.post(
                    `${import.meta.env.VITE_API_GATEWAY_URL}/auth/refresh`,
                    {}, // Body trống
                    { withCredentials: true } // Bắt buộc để gửi cookie
                );

                console.log('✅ Refresh thành công:', res.data);
                
                // Backend đã tự set lại cookie mới, ta không cần làm gì với localStorage
                processQueue(null, null);
                return axiosInstance(original);
            } catch (err) {
                    console.log('❌ Refresh thất bại:', err);
                    processQueue(err, null);
                    // Xóa flag auth để tránh redirect loop
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                } finally {
                    isRefreshing = false;
                }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;