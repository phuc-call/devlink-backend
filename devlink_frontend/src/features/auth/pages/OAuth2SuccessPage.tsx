import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuth2SuccessPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const username = params.get('username');
        const role = params.get('role');

        if (userId && username && role) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userId', userId);
            localStorage.setItem('role', role);
            localStorage.setItem('username', username);
            // Tokens are managed by HttpOnly cookies
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            navigate('/');
        } else {
            navigate('/login');
        }
    }, [navigate]);

    return <div>Đang xử lý đăng nhập...</div>;
}