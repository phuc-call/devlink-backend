import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { groupApi } from '../../../../api/user-service/groupApi';
import { followApi } from '../../../../api/user-service/followApi';
import { userProfileApi } from '../../../../api/user-service/userProfileApi';
import type { GroupSearchResponse } from '../../../../types/group.types';
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
        path: '/friends/feed',
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
        path: '/groups/feed',
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
                    <NavLink to="/friends/feed" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
                        <span className={styles.navIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect><line x1="8" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="16" y2="14"></line></svg>
                        </span>
                        <span className={styles.navLabel}>Bảng tin</span>
                    </NavLink>
                    <NavLink to="/friends/suggestions" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
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
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6" /><path d="M23 11h-6" /></svg>
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
                    <NavLink to="/groups/feed" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
                        <span className={styles.navIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect><line x1="8" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="16" y2="14"></line></svg>
                        </span>
                        <span className={styles.navLabel}>Bảng tin</span>
                    </NavLink>
                    {/* Your Groups: active when /groups/my-groups without ?role */}
                    <NavLink
                        to="/groups/my-groups"
                        className={() => `${styles.navItem} ${location.pathname === '/groups/my-groups' && !location.search ? styles.navActive : ''}`}
                    >
                        <span className={styles.navIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </span>
                        <span className={styles.navLabel}>Your Groups</span>
                    </NavLink>
                    {/* Groups You Manage: active when ?role=ADMIN */}
                    <NavLink
                        to="/groups/my-groups?role=ADMIN"
                        className={() => `${styles.navItem} ${location.search === '?role=ADMIN' ? styles.navActive : ''}`}
                    >
                        <span className={styles.navIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </span>
                        <span className={styles.navLabel}>Groups You Manage</span>
                    </NavLink>
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

            <div className={styles.divider} />
            <div className={styles.indexSection}>
                <SidebarGroups />
                <SidebarFriends />
            </div>
        </div>
    );
}

function SidebarGroups() {
    const [groups, setGroups] = useState<GroupSearchResponse[]>([]);
    const [isSuggested, setIsSuggested] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchGroups = async (currentPage: number, currentIsSuggested: boolean) => {
        setLoading(true);
        try {
            if (currentIsSuggested) {
                const res = await groupApi.getRecommendedGroups(currentPage, 5);
                if (res.data.data.content.length > 0) {
                    setGroups(prev => currentPage === 0 ? res.data.data.content : [...prev, ...res.data.data.content]);
                    setHasMore(!res.data.data.last);
                }
            } else {
                const res = await groupApi.getMyGroups('', currentPage, 5);
                if (res.data.data.content.length > 0) {
                    setGroups(prev => currentPage === 0 ? res.data.data.content : [...prev, ...res.data.data.content]);
                    setHasMore(!res.data.data.last);
                } else if (currentPage === 0) {
                    setIsSuggested(true);
                    const recRes = await groupApi.getRecommendedGroups(0, 5);
                    setGroups(recRes.data.data.content);
                    setHasMore(!recRes.data.data.last);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups(0, false);
    }, []);

    const handleSeeMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchGroups(nextPage, isSuggested);
    };

    if (groups.length === 0 && !loading) return null;

    return (
        <div className={styles.indexGroup}>
            <div className={styles.indexTitle}>{isSuggested ? 'Gợi ý nhóm' : 'Nhóm của bạn'}</div>
            {groups.map(g => (
                <button key={g.id} className={styles.recommendItem} onClick={() => navigate(`/groups/${g.id}`)}>
                    <img src={g.coverImage || 'https://via.placeholder.com/150'} alt="" className={styles.recommendAvatar} />
                    <div className={styles.recommendInfo}>
                        <span className={styles.recommendName}>{g.name}</span>
                        <span className={styles.recommendSub}>{g.memberCount} thành viên</span>
                    </div>
                </button>
            ))}
            {hasMore && (
                <button className={styles.viewMoreBtn} onClick={handleSeeMore} disabled={loading}>
                    {loading ? 'Đang tải...' : 'Xem thêm'}
                </button>
            )}
        </div>
    );
}

function SidebarFriends() {
    const [friends, setFriends] = useState<{id: number, name: string, avatar?: string, sub: string}[]>([]);
    const [isSuggested, setIsSuggested] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchFriends = async (currentPage: number, currentIsSuggested: boolean) => {
        setLoading(true);
        try {
            if (currentIsSuggested) {
                const res = await userProfileApi.getNormalRecommendations(currentPage, 5);
                const newItems = res.data.data.content.map(u => ({
                    id: u.id,
                    name: u.fullName,
                    avatar: u.avatar,
                    sub: u.school || u.city || 'Gợi ý cho bạn'
                }));
                
                setFriends(prev => currentPage === 0 ? newItems : [...prev, ...newItems]);
                setHasMore(res.data.data.hasNext);
            } else {
                const res = await followApi.getFollowList('FRIENDS', currentPage, 5);
                if (res.data.data.content.length > 0) {
                    const newItems = res.data.data.content.map(u => ({
                        id: u.userId,
                        name: u.fullName,
                        avatar: u.avatar,
                        sub: 'Bạn bè'
                    }));
                    setFriends(prev => currentPage === 0 ? newItems : [...prev, ...newItems]);
                    setHasMore(res.data.data.hasNext);
                } else if (currentPage === 0) {
                    setIsSuggested(true);
                    const recRes = await userProfileApi.getNormalRecommendations(0, 5);
                    const newItems = recRes.data.data.content.map(u => ({
                        id: u.id,
                        name: u.fullName,
                        avatar: u.avatar,
                        sub: u.school || u.city || 'Gợi ý cho bạn'
                    }));
                    setFriends(newItems);
                    setHasMore(recRes.data.data.hasNext);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends(0, false);
    }, []);

    const handleSeeMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchFriends(nextPage, isSuggested);
    };

    if (friends.length === 0 && !loading) return null;

    return (
        <div className={styles.indexGroup}>
            <div className={styles.indexTitle}>{isSuggested ? 'Gợi ý kết bạn' : 'Bạn bè'}</div>
            {friends.map(f => (
                <button key={f.id} className={styles.recommendItem} onClick={() => navigate(`/profile/${f.id}`)}>
                    <img src={f.avatar || 'https://via.placeholder.com/150'} alt="" className={styles.recommendAvatar} />
                    <div className={styles.recommendInfo}>
                        <span className={styles.recommendName}>{f.name}</span>
                        <span className={styles.recommendSub}>{f.sub}</span>
                    </div>
                </button>
            ))}
            {hasMore && (
                <button className={styles.viewMoreBtn} onClick={handleSeeMore} disabled={loading}>
                    {loading ? 'Đang tải...' : 'Xem thêm'}
                </button>
            )}
        </div>
    );
}