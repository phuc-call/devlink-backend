import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './LeftSidebar.module.css';
import { userProfileApi } from '../../../../api/user-service/userProfileApi.ts';
import type { UserRecommendationResponse } from '../../../../types/profile.types.ts';

/* ─── Nav chính ─── */
const NAV_ITEMS = [
    {
        label: 'Trang chủ',
        path: '/',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
        ),
    },
    {
        label: 'Khám phá',
        path: '/explore',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
            </svg>
        ),
    },
    {
        label: 'Thông báo',
        path: '/notifications',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
        ),
    },
    {
        label: 'Nhắn tin',
        path: '/chat',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
        ),
    },
    {
        label: 'Dữ liệu của tôi',
        path: '/feature-1',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
        ),
    },
    {
        label: 'Tính năng 2',
        path: '/feature-2',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
        ),
    },
    {
        label: 'Tính năng 3',
        path: '/feature-3',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
        ),
    },
];

export default function LeftSidebar() {
    const [recommendations, setRecommendations] = useState<UserRecommendationResponse[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        userProfileApi.getNormalRecommendations()
            .then(res => setRecommendations(res.data.data))
            .catch(() => setRecommendations([]));
    }, []);

    return (
        <div className={styles.sidebar}>
            {/* ── PHẦN 1: Navigation ── */}
            <nav className={styles.nav}>
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                            `${styles.navItem} ${isActive ? styles.navActive : ''}`
                        }
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className={styles.divider} />

            {/* ── PHẦN 2: Index dữ liệu ── */}
            <div className={styles.indexSection}>
                {/* Xu hướng */}
                <div className={styles.indexGroup}>
                    <h4 className={styles.indexTitle}>Xu hướng</h4>
                    <ul className={styles.indexList}>
                        {['#ReactJS', '#SpringBoot', '#TypeScript', '#DevOps', '#AI'].map(item => (
                            <li key={item}>
                                <button className={styles.indexItem}>{item}</button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Gợi ý theo dõi */}
                <div className={styles.indexGroup}>
                    <h4 className={styles.indexTitle}>Gợi ý theo dõi</h4>
                    <ul className={styles.indexList}>
                        {recommendations.length === 0 ? (
                            <li className={styles.indexItem}>Không có gợi ý</li>
                        ) : (
                            recommendations.slice(0, 5).map(user => (
                                <li key={user.id}>
                                    <button
                                        className={styles.recommendItem}
                                        onClick={() => navigate(`/profile/${user.id}`)}
                                    >
                                        {user.avatar && (
                                            <img
                                                src={user.avatar}
                                                alt={user.fullName}
                                                className={styles.recommendAvatar}
                                            />
                                        )}
                                        <div className={styles.recommendInfo}>
                                            <span className={styles.recommendName}>{user.fullName}</span>
                                            {user.school && (
                                                <span className={styles.recommendSub}>{user.school}</span>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}