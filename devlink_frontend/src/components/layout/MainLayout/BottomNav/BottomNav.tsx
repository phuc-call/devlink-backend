import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
    {
        label: 'Trang chủ',
        path: '/',
        end: true,
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    },
    {
        label: 'Khám phá',
        path: '/explore',
        end: false,
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>
        ),
    },
    {
        label: 'Video',
        path: '/videos',
        end: false,
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="15" height="10" rx="2" />
                <path d="M17 9l5-2v10l-5-2V9z" />
            </svg>
        ),
    },
    {
        label: 'Thông báo',
        path: '/notifications',
        end: false,
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
        ),
    },
    {
        label: 'Hồ sơ',
        path: '/profile/me',
        end: false,
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
];

export default function BottomNav() {
    return (
        <nav className={styles.bottomNav}>
            {NAV_ITEMS.map(item => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                        `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                    }
                >
                    {item.icon}
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
