import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { userProfileApi } from '../../../../api/user-service/userProfileApi.ts';

import type { UserProfileResponse } from '../../../../types/profile.types';
import styles from './Header.module.css';
import {authApi} from "../../../../api/user-service/authApi.ts";

const NAV_TABS = [
    { label: 'Phổ biến', path: '/' },
    { label: 'Following', path: '/following' },
];

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState<UserProfileResponse | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    /* Gọi API lấy thông tin user */
    useEffect(() => {
        userProfileApi.getProfile()
            .then(res => setUser(res.data.data))
            .catch(() => setUser(null));
    }, []);

    /* Đóng dropdown khi click ngoài */
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /* Logout: gọi API rồi xóa token */
    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await authApi.logout(refreshToken);
            }
        } catch {
            // bỏ qua lỗi, vẫn logout
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            navigate('/login');
        }
    };

    const initials = user?.fullName
        ? user.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
        : '?';

    return (
        <header className={styles.header}>
            {/* ── LEFT: Logo + Search ── */}
            <div className={styles.left}>
                <Link to="/" className={styles.logo}>DevLink</Link>
                <div className={styles.searchWrap}>
                    <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="none">
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                        <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Tìm kiếm..."
                    />
                </div>
            </div>

            {/* ── CENTER: Nav tabs ── */}
            <nav className={styles.center}>
                {NAV_TABS.map(tab => (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={`${styles.tab} ${location.pathname === tab.path ? styles.tabActive : ''}`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </nav>

            {/* ── RIGHT: Actions + Avatar ── */}
            <div className={styles.right}>
                {/* Chuông thông báo */}
                <button className={styles.iconBtn} title="Thông báo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                </button>

                {/* Message */}
                <button className={styles.iconBtn} title="Tin nhắn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>

                {/* Avatar + Dropdown */}
                <div className={styles.avatarWrap} ref={dropdownRef}>
                    <button
                        className={styles.avatarBtn}
                        onClick={() => setDropdownOpen(prev => !prev)}
                        title="Tài khoản"
                    >
                        {user?.avatarUrl
                            ? <img src={user.avatarUrl} alt="avatar" className={styles.avatarImg} />
                            : <span className={styles.avatarInitials}>{initials}</span>
                        }
                    </button>

                    {dropdownOpen && (
                        <div className={styles.dropdown}>
                            {/* User info */}
                            <div className={styles.dropUser}>
                                <div className={styles.dropAvatar}>
                                    {user?.avatarUrl
                                        ? <img src={user.avatarUrl} alt="avatar" />
                                        : <span>{initials}</span>
                                    }
                                </div>
                                <div className={styles.dropInfo}>
                                    <span className={styles.dropName}>{user?.fullName || 'Người dùng'}</span>
                                    {/*<span className={styles.dropSub}>{user?.fullName ? `@${user.fullName}` : ''}</span>*/}
                                </div>
                            </div>

                            <div className={styles.dropDivider} />

                            {/* Feature items — bổ sung sau */}
                            <button className={styles.dropItem}>
                                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                    <path d="M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeLinecap="round"/>
                                    <path d="M3 18a7 7 0 0 1 14 0" strokeLinecap="round"/>
                                </svg>
                                Trang cá nhân
                            </button>
                            <button className={styles.dropItem}>
                                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                    <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2z"/>
                                    <path d="M10 6v4l3 2" strokeLinecap="round"/>
                                </svg>
                                Tính năng 1
                            </button>
                            <button className={styles.dropItem}>
                                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                    <rect x="3" y="3" width="14" height="14" rx="2"/>
                                    <path d="M3 8h14" strokeLinecap="round"/>
                                </svg>
                                Tính năng 2
                            </button>

                            <div className={styles.dropDivider} />

                            {/* Logout */}
                            <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                    <path d="M13 15l3-3m0 0l-3-3m3 3H8m5-9H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Đăng xuất
                            </button>

                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}