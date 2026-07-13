import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../../api/user-service/authApi.ts';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authApi.login({ email, password });
            const data = res.data?.data;
            if (data) {
                // Backend đã set HttpOnly cookie, chỉ lưu metadata cần thiết
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userId', String(data.userId));
                localStorage.setItem('role', data.role ?? '');
                localStorage.setItem('username', data.username ?? '');
                if (data.accessToken) {
                    try {
                        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
                        if (payload.exp) {
                            localStorage.setItem('accessTokenExp', (payload.exp * 1000).toString());
                        }
                    } catch (e) {}
                }
                // Xóa token cũ nếu còn
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
            navigate('/');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string; code?: string } } };
            const code = e.response?.data?.code;
            if (code === 'ACCOUNT_LOCKED') {
                setError('Tài khoản đã bị khóa tạm thời do đăng nhập sai nhiều lần');
            } else if (code === 'INVALID_CREDENTIALS') {
                setError('Email hoặc mật khẩu không đúng');
            } else {
                setError(e.response?.data?.message ?? 'Đăng nhập thất bại');
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
                    <p>Kết nối cộng đồng lập trình viên</p>
                </div>

                <div className="auth-card">
                    <h2>Đăng nhập</h2>
                    <p className="subtitle">Chào mừng bạn quay trở lại!</p>

                    {error && <div className="error-box">{error}</div>}

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
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu"
                                    required
                                />
                                <button
                                    type="button"
                                    className="input-eye"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
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
                            globalThis.location.href = `${import.meta.env.VITE_API_GATEWAY_URL}/oauth2/authorization/google`;
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