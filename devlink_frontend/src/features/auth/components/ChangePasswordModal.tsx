import { useState } from 'react';
import { authApi } from '../../../api/user-service/authApi.ts';
import { useNavigate } from 'react-router-dom';

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);
        try {
            await authApi.changePassword({ currentPassword, newPassword });
            setSuccess('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            
            // Xóa session ở client và chuyển về login
            setTimeout(() => {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userId');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                navigate('/login');
            }, 2000);
            
        } catch (err: any) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#fff', borderRadius: '12px', padding: '24px',
                width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                    Đổi mật khẩu
                </h3>
                
                {error && <div style={{ color: '#ef4444', background: '#fee2e2', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
                {success && <div style={{ color: '#10b981', background: '#d1fae5', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '10px', borderRadius: '6px',
                                border: '1px solid #d1d5db', outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Mật khẩu mới</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Tối thiểu 8 ký tự (hoa, thường, số, ký tự đặc biệt)"
                            style={{
                                width: '100%', padding: '10px', borderRadius: '6px',
                                border: '1px solid #d1d5db', outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '10px', borderRadius: '6px',
                                border: '1px solid #d1d5db', outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading || success !== ''}
                            style={{
                                padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db',
                                background: '#fff', cursor: 'pointer', fontWeight: 500, color: '#374151'
                            }}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || success !== ''}
                            style={{
                                padding: '8px 16px', borderRadius: '6px', border: 'none',
                                background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
