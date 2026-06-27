import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function decodeJwt(token: string): Record<string, unknown> | null {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

export default function OAuth2SuccessPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (accessToken && refreshToken) {
            // Decode JWT 1 lần để lấy metadata, không lưu token thật
            const payload = decodeJwt(accessToken);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userId', String(payload?.['sub'] ?? ''));
            localStorage.setItem('role', String(payload?.['role'] ?? ''));
            localStorage.setItem('username', String(payload?.['username'] ?? ''));
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            navigate('/');
        } else {
            navigate('/login');
        }
    }, []);

    return <div>Đang xử lý...</div>;
}