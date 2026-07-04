import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './LeftSidebar.module.css';
import { userProfileApi } from '../../../../api/user-service/userProfileApi.ts';
import { groupApi } from '../../../../api/user-service/groupApi.ts';
import type { UserRecommendationResponse } from '../../../../types/profile.types.ts';
import type { GroupSearchResponse } from '../../../../types/group.types.ts';

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
        label: 'Khám phá',
        path: '/explore',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
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
    const [recommendations, setRecommendations] = useState<UserRecommendationResponse[]>([]);
    const [myGroups, setMyGroups] = useState<GroupSearchResponse[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        userProfileApi.getNormalRecommendations()
            .then(res => setRecommendations(res.data.data))
            .catch(() => setRecommendations([]));
            
        groupApi.getMyGroups(undefined, 0, 5)
            .then(res => setMyGroups(res.data.data.content))
            .catch(() => setMyGroups([]));
    }, []);

    const getGroupBorderStyle = (role?: string | null) => {
        if (role === 'ADMIN') return { border: '3px solid red' };
        if (role === 'MODERATOR') return { border: '3px solid blue' };
        return {};
    };


    return (
        <div className={styles.sidebar}>

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


            <div className={styles.indexSection}>
                {/* Nhóm của tôi */}
                <div className={styles.indexGroup}>
                    <h4 className={styles.indexTitle}>Nhóm của tôi</h4>
                    <ul className={styles.indexList}>
                        {myGroups.length === 0 ? (
                            <li className={styles.indexItem}>Chưa tham gia nhóm nào</li>
                        ) : (
                            myGroups.map(group => (
                                <li key={group.id}>
                                    <button 
                                        className={`${styles.indexItem} ${styles.groupItem}`}
                                        onClick={() => navigate(`/groups/${group.id}`)}
                                        style={getGroupBorderStyle(group.role)}
                                    >
                                        <div className={styles.groupInfo}>
                                            <span className={styles.groupName}>{group.name}</span>
                                            <span className={styles.groupMemberCount}>{group.memberCount} thành viên</span>
                                        </div>
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                    {myGroups.length > 0 && (
                        <button 
                            className={styles.viewMoreBtn}
                            onClick={() => navigate('/groups/my-groups')}
                        >
                            Xem thêm
                        </button>
                    )}
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