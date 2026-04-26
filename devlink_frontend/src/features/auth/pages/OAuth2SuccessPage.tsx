import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuth2SuccessPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (accessToken && refreshToken) {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            navigate('/');
        } else {
            navigate('/login');
        }
    }, []);

    return <div>Đang xử lý...</div>;
}