import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import styles from './LeftSidebar.module.css';

/* ─── Nav chính ─── */
const NAV_ITEMS = [
    {
        label: 'Trang chủ',
        path: '/',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    },
    {
        label: 'Friends',
        path: '/friends',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
        ),
    },
    {
        label: 'Groups',
        path: '/groups/my-groups',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            </svg>
        ),
    },
    {
        label: 'Thông báo',
        path: '/notifications',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
        ),
    },
    {
        label: 'Nhắn tin',
        path: '/chat',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
    {
        label: 'Dữ liệu của tôi',
        path: '/feature-1',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        label: 'Thư viện của tôi',
        path: '/saved',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },

    {
        label: 'Video',
        path: '/videos',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="15" height="10" rx="2" />
                <path d="M17 9l5-2v10l-5-2V9z" />
            </svg>
        ),
    },
];

export default function LeftSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const isFriendsRoute = location.pathname.startsWith('/friends');
    const isGroupsRoute = location.pathname.startsWith('/groups');

    // For main nav items that use startsWith matching instead of exact
    const isPathActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    if (isFriendsRoute) {
        return (
            <div className={styles.sidebar}>
                <div className={styles.subSidebarHeader}>
                    <button onClick={() => navigate('/')} className={styles.backBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className={styles.subSidebarTitle}>Bạn bè</h2>
                </div>
                <nav className={styles.nav}>
                    <NavLink to="/friends" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
                        <span className={styles.navIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                        </span>
                        <span className={styles.navLabel}>Gợi ý</span>
                    </NavLink>
                    <NavLink to="/friends/my-friends" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
                        <span className={styles.navIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </span>
                        <span className={styles.navLabel}>Bạn bè của tôi</span>
                    </NavLink>
                    <NavLink to="/friends/following" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
                        <span className={styles.navIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
                        </span>
                        <span className={styles.navLabel}>Người tôi follow</span>
                    </NavLink>
                    <NavLink to="/friends/followers" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
                        <span className={styles.navIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
                        </span>
                        <span className={styles.navLabel}>Người follow tôi</span>
                    </NavLink>
                </nav>
            </div>
        );
    }

    if (isGroupsRoute) {
        return (
            <div className={styles.sidebar}>
                <div className={styles.subSidebarHeader}>
                    <button onClick={() => navigate('/')} className={styles.backBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className={styles.subSidebarTitle}>Nhóm</h2>
                </div>
                <nav className={styles.nav}>
                    {/* Your Groups: active when /groups/my-groups without ?role */}
                    <button
                        onClick={() => navigate('/groups/my-groups')}
                        className={`${styles.navItem} ${location.pathname === '/groups/my-groups' && !location.search ? styles.navActive : ''}`}
                    >
                        <span className={styles.navIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </span>
                        <span className={styles.navLabel}>Your Groups</span>
                    </button>
                    {/* Groups You Manage: active when ?role=ADMIN */}
                    <button
                        onClick={() => navigate('/groups/my-groups?role=ADMIN')}
                        className={`${styles.navItem} ${location.search === '?role=ADMIN' ? styles.navActive : ''}`}
                    >
                        <span className={styles.navIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </span>
                        <span className={styles.navLabel}>Groups You Manage</span>
                    </button>
                    <NavLink to="/groups/create" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
                        <span className={styles.navIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
                        </span>
                        <span className={styles.navLabel}>Create New Group</span>
                    </NavLink>
                </nav>
            </div>
        );
    }

    return (
        <div className={styles.sidebar}>

            <nav className={styles.nav}>
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/' || item.path === '/groups/my-groups'}
                        className={() =>
                            `${styles.navItem} ${isPathActive(item.path) ? styles.navActive : ''}`
                        }
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>


        </div>
    );
}