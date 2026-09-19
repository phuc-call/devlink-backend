import { STORAGE_KEYS, STORAGE_VALUES } from '../../../constants/storage';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';

export default function OAuth2SuccessPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const username = params.get('username');
        const role = params.get('role');

        if (userId && username && role) {
            localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, STORAGE_VALUES.LOGGED_IN_TRUE);
            localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
            localStorage.setItem(STORAGE_KEYS.ROLE, role);
            localStorage.setItem(STORAGE_KEYS.USERNAME, username);
            // Default exp: now + 15 mins (match backend token expiry config)
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXP, (Date.now() + 15 * 60 * 1000).toString());
            // Tokens are managed by HttpOnly cookies
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            navigate(ROUTES.HOME);
        } else {
            navigate(ROUTES.LOGIN);
        }
    }, [navigate]);

    return <div>Đang xử lý đăng nhập...</div>;
}