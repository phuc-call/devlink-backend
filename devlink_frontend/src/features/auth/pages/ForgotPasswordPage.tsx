import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../../api/user-service/authApi.ts';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

    useEffect(() => {
        let timer: any;
        if (step === 2 && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setError('Mã OTP đã hết hạn, vui lòng gửi lại.');
        }
        return () => clearInterval(timer);
    }, [step, timeLeft]);

    const handleInit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authApi.forgotPasswordInit(email);
            setStep(2);
            setTimeLeft(300); // Reset timer on new init
            setSuccess('Mã OTP đã được gửi đến email của bạn.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể gửi email. Vui lòng kiểm tra lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);
        try {
            await authApi.forgotPasswordReset({ email, otp, newPassword });
            setSuccess('Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-logo">
                    <h1>DevLink</h1>
                    <p>Khôi phục mật khẩu</p>
                </div>

                <div className="auth-card">
                    {step === 1 ? (
                        <>
                            <h2>Quên mật khẩu?</h2>
                            <p className="subtitle">Nhập email của bạn để nhận mã khôi phục</p>

                            {error && <div className="error-box">{error}</div>}

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
                                    {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2>Tạo mật khẩu mới</h2>
                            <p className="subtitle">
                                Nhập mã OTP vừa nhận và mật khẩu mới<br/>
                                <span style={{ color: timeLeft > 0 ? '#10b981' : '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>
                                    {timeLeft > 0 ? `OTP còn hạn trong: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : 'OTP đã hết hạn'}
                                </span>
                            </p>

                            {error && <div className="error-box">{error}</div>}
                            {success && timeLeft > 0 && !success.includes('Đổi mật khẩu thành công') && (
                                <div style={{ color: '#10b981', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', marginBottom: '16px' }}>{success}</div>
                            )}
                            {success && success.includes('Đổi mật khẩu thành công') && (
                                <div style={{ color: '#10b981', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', marginBottom: '16px' }}>{success}</div>
                            )}

                            <form onSubmit={handleReset}>
                                <div className="form-group">
                                    <label htmlFor="otp">Mã xác nhận (OTP)</label>
                                    <input
                                        id="otp"
                                        type="text"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="Nhập 6 số OTP"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="newPassword">Mật khẩu mới</label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Tối thiểu 8 ký tự (chữ hoa, số, ký tự đặc biệt)"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Nhập lại mật khẩu mới"
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn-primary" disabled={loading || success.includes('Đổi mật khẩu thành công') || timeLeft === 0}>
                                    {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                                </button>
                                
                                {timeLeft === 0 && (
                                    <button type="button" onClick={handleInit} className="btn-primary" style={{ marginTop: '10px', background: '#4b5563' }} disabled={loading}>
                                        {loading ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
                                    </button>
                                )}
                            </form>
                        </>
                    )}

                    <p className="auth-footer" style={{ marginTop: '20px' }}>
                        <Link to="/login">Quay lại đăng nhập</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
