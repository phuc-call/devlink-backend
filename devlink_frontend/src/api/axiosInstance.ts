import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_GATEWAY_URL,
});

axiosInstance.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    res => res,
    async error => {
        const original = error.config;

        // LOG 1: Xem request nào bị lỗi
        console.log('🔴 Request lỗi:', error.config?.url, 'Status:', error.response?.status);

        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            // LOG 2: Xem có refreshToken không
            console.log('🔑 refreshToken:', refreshToken ? 'CÓ' : 'KHÔNG CÓ');

            if (refreshToken) {
                try {
                    // LOG 3: Xem đang gọi URL nào
                    console.log('🔄 Đang gọi refresh tại:', `${import.meta.env.VITE_API_GATEWAY_URL}/auth/refresh`);

                    const res = await axios.post(
                        `${import.meta.env.VITE_API_GATEWAY_URL}/auth/refresh`,
                        { refreshToken }
                    );

                    // LOG 4: Xem response trả về gì
                    console.log('✅ Refresh thành công:', res.data);

                    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);
                    original.headers.Authorization = `Bearer ${accessToken}`;
                    return axiosInstance(original);
                } catch (err) {
                    // LOG 5: Xem lỗi refresh là gì
                    console.log('❌ Refresh thất bại:', err);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
            } else {
                console.log('⛔ Không có refreshToken → logout');
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;