import React, { useEffect, useState } from 'react';
import { Laptop, Smartphone, Tablet, Monitor } from 'lucide-react';
import { authApi } from '../../../api/user-service/authApi';
import type { AuthTokenItemResponse } from '../../../types/auth.types';

const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toUpperCase()) {
        case 'MOBILE':
            return <Smartphone className="w-8 h-8 text-blue-500" />;
        case 'TABLET':
            return <Tablet className="w-8 h-8 text-purple-500" />;
        case 'DESKTOP':
            return <Laptop className="w-8 h-8 text-gray-700" />;
        default:
            return <Monitor className="w-8 h-8 text-gray-400" />;
    }
};

export const SessionManager: React.FC = () => {
    const [sessions, setSessions] = useState<AuthTokenItemResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [passwordPrompt, setPasswordPrompt] = useState<{ isOpen: boolean; tokenId?: number | 'ALL' }>({ isOpen: false });
    const [password, setPassword] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await authApi.getSessions();
            setSessions(response.data.data.tokens);
        } catch (err) {
            console.error('Failed to fetch sessions', err);
            setError('Không thể tải danh sách phiên đăng nhập.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleLogoutConfirm = async () => {
        if (!password) {
            setError('Vui lòng nhập mật khẩu.');
            return;
        }
        
        try {
            setActionLoading(true);
            setError(null);
            
            if (passwordPrompt.tokenId === 'ALL') {
                await authApi.deleteAllOtherSessions(password);
            } else if (passwordPrompt.tokenId) {
                await authApi.deleteSession(passwordPrompt.tokenId, password);
            }
            
            // Refresh list
            setPasswordPrompt({ isOpen: false });
            setPassword('');
            await fetchSessions();
        } catch (err: any) {
            console.error('Failed to logout session', err);
            setError(err.response?.data?.message || 'Mật khẩu không chính xác hoặc có lỗi xảy ra.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Lịch sử đăng nhập</h2>
                {sessions.length > 1 && (
                    <button 
                        onClick={() => setPasswordPrompt({ isOpen: true, tokenId: 'ALL' })}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                        Đăng xuất tất cả thiết bị khác
                    </button>
                )}
            </div>

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : sessions.length === 0 ? (
                <p>Không có phiên đăng nhập nào.</p>
            ) : (
                <div className="space-y-4">
                    {sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-100 rounded-full shrink-0">
                                    {getDeviceIcon(session.deviceType)}
                                </div>
                                <div>
                                    <div className="font-semibold flex items-center gap-2 text-gray-800">
                                        {session.driveName}
                                        {session.currentSession && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                Đang hoạt động
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-0.5">
                                        IP: {session.ipAddress}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        Đăng nhập lần cuối: {new Date(session.lastUsedAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            
                            {!session.currentSession && (
                                <button
                                    onClick={() => setPasswordPrompt({ isOpen: true, tokenId: session.id })}
                                    className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded text-sm"
                                >
                                    Đăng xuất
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Password Prompt Modal */}
            {passwordPrompt.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h3 className="font-bold text-lg mb-2">Yêu cầu xác thực</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Vui lòng nhập mật khẩu của bạn để đăng xuất thiết bị này.
                        </p>
                        
                        <input
                            type="password"
                            className="w-full border rounded p-2 mb-2"
                            placeholder="Nhập mật khẩu..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                disabled={actionLoading}
                                onClick={() => {
                                    setPasswordPrompt({ isOpen: false });
                                    setPassword('');
                                    setError(null);
                                }}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={actionLoading || !password}
                                onClick={handleLogoutConfirm}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
