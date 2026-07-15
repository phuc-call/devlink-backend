import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { userProfileApi } from '../../../../api/user-service/userProfileApi.ts';
import type { UserProfileResponse } from '../../../../types/profile.types';
import NotificationBell from '../NotificationBell/NotificationBell.tsx';
import BottomNav from '../BottomNav/BottomNav.tsx';
import styles from './Header.module.css';
import { authApi } from "../../../../api/user-service/authApi.ts";
import { UserPlus, Users } from 'lucide-react';
import { JoinGroupModal } from '../../../../features/post/components/ExploreModals';

import { ChangePasswordModal } from '../../../../features/auth/components/ChangePasswordModal.tsx';

const NAV_TABS = [
    { label: 'Phổ biến', path: '/' },
    { label: 'Following', path: '/following' },
];

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState<UserProfileResponse | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [joinGroupModal, setJoinGroupModal] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        userProfileApi.getProfile()
            .then(res => setUser(res.data.data))
            .catch(() => setUser(null));
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setDropdownOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setDropdownOpen(false);
        setIsLoggingOut(true);
        try {
            await authApi.logout()
        } catch {

        } finally {

            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userId');
            localStorage.removeItem('role');
            localStorage.removeItem('username');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            navigate('/login');
        }
    };

    const handleSearch = () => {
        if (!searchValue.trim()) return;
        navigate(`/explore?name=${encodeURIComponent(searchValue.trim())}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    const initials = user?.fullName
        ? user.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
        : '?';

    return (
        <>
            {/* ── Logout Loading Overlay ── */}
            {isLoggingOut && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '16px',
                }}>
                    <div style={{
                        width: 48, height: 48,
                        border: '4px solid rgba(255,255,255,0.25)',
                        borderTop: '4px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: '#fff', fontSize: 16, fontWeight: 500, margin: 0 }}>
                        Đang đăng xuất...
                    </p>
                </div>
            )}

            <header className={styles.header}>
                {/* ── LEFT: Logo + Search ── */}
                <div className={styles.left}>
                    <Link to="/" className={styles.logo}>DevLink</Link>
                    <div className={styles.searchWrap}>
                        <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="none"
                            onClick={handleSearch} style={{ cursor: 'pointer' }}>
                            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                            <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    {/* Add Group Icons */}
                    <div className={styles.groupIconsWrap}>
                        <button title="Tạo nhóm mới" onClick={() => navigate('/groups/create')} className={styles.groupIconBtn}>
                            <UserPlus size={18} />
                        </button>
                        <button title="Tham gia nhóm" onClick={() => setJoinGroupModal(true)} className={styles.groupIconBtn}>
                            <Users size={18} />
                        </button>
                    </div>
                </div>

                {/* ── CENTER: Nav tabs ── */}
                <nav className={styles.center}>
                    {NAV_TABS.map(tab => (
                        <Link key={tab.path} to={tab.path}
                            className={`${styles.tab} ${location.pathname === tab.path ? styles.tabActive : ''}`}>
                            {tab.label}
                        </Link>
                    ))}
                </nav>

                {/* ── RIGHT: Actions + Avatar ── */}
                <div className={styles.right}>
                    <NotificationBell />

                    <button type="button" className={styles.iconBtn} title="Tin nhắn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </button>

                    <div className={styles.avatarWrap} ref={dropdownRef}>
                        <button type="button" className={styles.avatarBtn}
                            onClick={() => setDropdownOpen(prev => !prev)} title="Tài khoản">
                            {user?.avatarUrl
                                ? <img src={user.avatarUrl} alt="avatar" className={styles.avatarImg} />
                                : <span className={styles.avatarInitials}>{initials}</span>
                            }
                        </button>

                        {dropdownOpen && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropUser}>
                                    <div className={styles.dropAvatar}>
                                        {user?.avatarUrl
                                            ? <img src={user.avatarUrl} alt="avatar" />
                                            : <span>{initials}</span>
                                        }
                                    </div>
                                    <div className={styles.dropInfo}>
                                        <span className={styles.dropName}>{user?.fullName || 'Người dùng'}</span>
                                    </div>
                                </div>
                                <div className={styles.dropDivider} />
                                <button type="button" className={styles.dropItem}
                                    onClick={() => { setDropdownOpen(false); setShowChangePassword(true); }}>
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Đổi mật khẩu
                                </button>
                                <button type="button" className={styles.dropItem}
                                    onClick={() => { navigate('/profile/me'); setDropdownOpen(false); }}>
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <path d="M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeLinecap="round" />
                                        <path d="M3 18a7 7 0 0 1 14 0" strokeLinecap="round" />
                                    </svg>
                                    Trang cá nhân
                                </button>
                                <button type="button" className={styles.dropItem}
                                    onClick={() => { navigate('/feature-1'); setDropdownOpen(false); }}>
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <rect x="3" y="3" width="7" height="7" rx="1" />
                                        <rect x="10" y="3" width="7" height="7" rx="1" />
                                        <rect x="3" y="10" width="7" height="7" rx="1" />
                                        <rect x="10" y="10" width="7" height="7" rx="1" />
                                    </svg>
                                    Dữ liệu của tôi
                                </button>
                                <button type="button" className={styles.dropItem}
                                    onClick={() => { navigate('/saved'); setDropdownOpen(false); }}>
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <path d="M16 18l-6-4.5L4 18V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Thư viện của tôi
                                </button>
                                <div className={styles.dropDivider} />
                                <button
                                    type="button"
                                    className={`${styles.dropItem} ${styles.dropLogout}`}
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                >
                                    {isLoggingOut ? (
                                        <span style={{
                                            display: 'inline-block', width: 16, height: 16,
                                            border: '2px solid rgba(255,255,255,0.4)',
                                            borderTop: '2px solid currentColor',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite',
                                        }} />
                                    ) : (
                                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                            <path d="M13 15l3-3m0 0l-3-3m3 3H8m5-9H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8"
                                                strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <BottomNav />
            {joinGroupModal && <JoinGroupModal onClose={() => setJoinGroupModal(false)} onSuccess={() => setJoinGroupModal(false)} />}
            {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
        </>
    );
}