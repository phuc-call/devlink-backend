import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {authApi} from '../../../api/user-service/authApi.ts';
import type {AuthStep} from '../../../types/auth.types.ts';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<AuthStep>('init');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInit =  async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authApi.registerInit({email});
            setStep('verify');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message ?? 'Gửi OTP thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authApi.registerVerify({email, otp});
            setStep('complete');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message ?? 'Gửi OTP thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete =  async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Mật khẩu không khớp');
            return;
        }
        setLoading(true);
        try {
            const res = await authApi.registerComplete({email, password, username});
            const {accessToken, refreshToken} = res.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            navigate('/');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message ?? 'Gửi OTP thất bại');
        } finally {
            setLoading(false);
        }
    };

    const stepLabel: Record<AuthStep, string> = {
        init: 'Nhập email',
        verify: 'Xác nhận OTP',
        complete: 'Tạo tài khoản',
    };

    const stepIndex: Record<AuthStep, number> = {
        init: 0, verify: 1, complete: 2,
    };

    return (
        <div className="auth-page">
            <div className="auth-container">

                {/* Logo */}
                <div className="auth-logo">
                    <h1>DevLink</h1>
                    <p>Kết nối cộng đồng lập trình viên</p>
                </div>

                {/* Card */}
                <div className="auth-card">

                    {/* Step indicator */}
                    <div className="step-indicator">
                        {(['init', 'verify', 'complete'] as AuthStep[]).map((s, i) => (
                            <div key={s} style={{display: 'flex', alignItems: 'center', flex: 1}}>
                                <div className={`step-dot ${stepIndex[step] >= i ? 'active' : 'inactive'}`}>
                                    {stepIndex[step] > i ? '✓' : i + 1}
                                </div>
                                {i < 2 && (
                                    <div className={`step-line ${stepIndex[step] > i ? 'active' : 'inactive'}`}/>
                                )}
                            </div>
                        ))}
                    </div>

                    <h2>{stepLabel[step]}</h2>
                    <p className="subtitle">
                        {step === 'init' && 'Nhập email để nhận mã xác nhận'}
                        {step === 'verify' && `Mã OTP đã gửi đến ${email}`}
                        {step === 'complete' && 'Hoàn tất thông tin tài khoản'}
                    </p>

                    {error && <div className="error-box">{error}</div>}

                    {/* Step 1 — Email */}
                    {step === 'init' && (
                        <form onSubmit={handleInit}>
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
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                            </button>
                        </form>
                    )}

                    {/* Step 2 — OTP */}
                    {step === 'verify' && (
                        <form onSubmit={handleVerify}>
                            <div className="form-group">
                                <label htmlFor="otp">Mã OTP (6 chữ số)</label>
                                <input
                                    id="otp"
                                    type="text"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    maxLength={6}
                                    required
                                    style={{textAlign: 'center', letterSpacing: '0.3em'}}
                                />
                                <p style={{fontSize: '12px', color: 'var(--color-text-sub)', marginTop: '6px'}}>
                                    Mã có hiệu lực trong 5 phút
                                </p>
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading || otp.length !== 6}>
                                {loading ? 'Đang xác nhận...' : 'Xác nhận OTP'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setStep('init')}>
                                ← Đổi email
                            </button>
                        </form>
                    )}

                    {/* Step 3 — Complete */}
                    {step === 'complete' && (
                        <form onSubmit={handleComplete}>
                            <div className="form-group">
                                <label htmlFor="fullName">Tên người dùng</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="devlink_user"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Mật khẩu</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Tối thiểu 8 ký tự"
                                    required
                                />
                                <p style={{fontSize: '12px', color: 'var(--color-text-sub)', marginTop: '6px'}}>
                                    Phải có chữ hoa, chữ thường, số và ký tự đặc biệt
                                </p>
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                            </button>
                        </form>
                    )}

                    <div className="divider"><span>hoặc</span></div>

                    <button
                        type="button"
                        className="btn-google"
                        onClick={() => {
                            document.cookie = 'oauth_mode=register; path=/';
                            window.location.href = `${import.meta.env.VITE_API_GATEWAY_URL}/oauth2/authorization/google`;
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                        </svg>
                        Đăng ký với Google
                    </button>
                </div>

                <p className="auth-footer">
                    Đã có tài khoản?{' '}
                    <Link to="/login">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}