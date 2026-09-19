import { STORAGE_KEYS, STORAGE_VALUES } from '../../../constants/storage';
import { ROUTES } from '../../../constants/routes';
import { AUTH_MESSAGES } from '../../../constants/messages';
import { ERROR_CODES } from '../../../constants/roles';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../../api/user-service/authApi.ts';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authApi.login({ email, password });
            const data = res.data?.data;
            if (data) {
                // Backend đã set HttpOnly cookie, chỉ lưu metadata cần thiết
                localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, STORAGE_VALUES.LOGGED_IN_TRUE);
                localStorage.setItem(STORAGE_KEYS.USER_ID, String(data.userId));
                localStorage.setItem(STORAGE_KEYS.ROLE, data.role ?? '');
                localStorage.setItem(STORAGE_KEYS.USERNAME, data.username ?? '');
                if (data.accessToken) {
                    try {
                        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
                        if (payload.exp) {
                            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXP, (payload.exp * 1000).toString());
                        }
                    } catch (e) {}
                }
                // Xóa token cũ nếu còn
                localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            }
            navigate(ROUTES.HOME);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string; code?: string } } };
            const code = e.response?.data?.code;
            if (code === ERROR_CODES.ACCOUNT_LOCKED) {
                setError(AUTH_MESSAGES.ACCOUNT_LOCKED);
            } else if (code === ERROR_CODES.INVALID_CREDENTIALS) {
                setError(AUTH_MESSAGES.INVALID_CREDENTIALS);
            } else {
                setError(e.response?.data?.message ?? AUTH_MESSAGES.LOGIN_FAILED);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">

                <div className="auth-logo">
                    <h1>DevLink</h1>
                </div>

                <div className="auth-card">
                    <h2>Đăng nhập</h2>
                    <p className="subtitle">Chào mừng bạn quay trở lại!</p>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <div className="label-row">
                                <label htmlFor="password">Mật khẩu</label>
                                <Link to="/forgot-password">Quên mật khẩu?</Link>
                            </div>
                            <div className="input-wrapper">
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>

                    <div className="divider"><span>hoặc</span></div>

                    <button
                        type="button"
                        className="btn-google"
                        onClick={() => {
                            document.cookie = 'oauth_mode=login; path=/';
                            globalThis.location.href = `${import.meta.env.VITE_API_GATEWAY_URL}${ROUTES.OAUTH_GOOGLE}`;
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                        </svg>
                        Đăng nhập với Google
                    </button>
                </div>

                <p className="auth-footer">
                    Chưa có tài khoản?{' '}
                    <Link to="/register">Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
}