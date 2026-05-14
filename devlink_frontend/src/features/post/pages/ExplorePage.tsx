import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {userProfileApi} from '../../../api/user-service/userProfileApi';

import type {UserSearchResponse} from '../../../types/profile.types';
import styles from './ExplorePage.module.css';

type FilterGroup = 'all' | 'friends' | 'followers' | 'following';

// ── Props readonly để tránh warning "Mark the props as read-only"
interface UserCardProps {
    readonly user: UserSearchResponse;
}

function UserCard({user}: UserCardProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        void navigate(`/profile/${user.userId}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
    };

    return (
        <div
            className={styles.card}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
        >
            <div className={styles.cardAvatar}>
                {user.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.fullName}/>
                    : <span>?</span>
                }
            </div>
            <div className={styles.cardInfo}>
                <p className={styles.cardName}>{user.fullName}</p>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className={`${styles.card} ${styles.skeleton}`}>
            <div className={styles.skeletonAvatar}/>
            <div className={styles.skeletonInfo}>
                <div className={styles.skeletonLine}/>
            </div>
        </div>
    );
}

const FILTER_TABS: ReadonlyArray<{ readonly key: FilterGroup; readonly label: string }> = [
    {key: 'all', label: 'Tất cả'},
    {key: 'friends', label: 'Bạn bè'},
    {key: 'followers', label: 'Người theo dõi'},
    {key: 'following', label: 'Đang theo dõi'},
];

interface IconFilterProps {
    readonly size?: number;
}

function IconFilter({size = 15}: IconFilterProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
    );
}

export default function ExplorePage() {
    const [searchParams] = useSearchParams();

    // ── Dùng useMemo thay vì useEffect+setState để tránh cascading render (dòng 86)
    const name = useMemo(() => searchParams.get('name') ?? '', [searchParams]);

    const [city, setCity] = useState('');
    const [filterGroup, setFilterGroup] = useState<FilterGroup>('all');
    const [provinces, setProvinces] = useState<string[]>([]);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [groupOpen, setGroupOpen] = useState(true);
    const [cityOpen, setCityOpen] = useState(false);
    const cityDropdownRef = useRef<HTMLDivElement>(null);

    const [users, setUsers] = useState<UserSearchResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    const loaderRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        userProfileApi.getProvinces()
            .then(res => setProvinces(res.data.data))
            .catch(() => setProvinces([]));
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node))
                setCityOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchUsers = useCallback(async (
        searchName: string, searchCity: string, group: FilterGroup,
        pageNum: number, reset: boolean
    ) => {
        if (!searchName.trim()) return;
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setLoading(true);
        try {
            const res = await userProfileApi.searchUsers({
                name: searchName.trim(),
                city: searchCity || undefined,
                friendsOnly: group === 'friends',
                followersOnly: group === 'followers',
                followingOnly: group === 'following',
                page: pageNum, size: 20,
            });
            const data = res.data.data;
            setUsers(prev => reset ? data.users.content : [...prev, ...data.users.content]);
            setHasMore(!data.users.last);
            setPage(pageNum);
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== 'CanceledError') console.error(err);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    }, []);

    // ── Reset + fetch khi filter thay đổi (dòng 129)
    // setState ở đây là intentional — cần reset trước khi fetch mới
    useEffect(() => {
        if (!name.trim()) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUsers([]);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPage(0);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasMore(true);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInitialLoad(true);
        void fetchUsers(name, city, filterGroup, 0, true);
    }, [name, city, filterGroup, fetchUsers]);

    useEffect(() => {
        const el = loaderRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loading && !initialLoad)
                void fetchUsers(name, city, filterGroup, page + 1, false);
        }, {threshold: 0.1});
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading, initialLoad, page, name, city, filterGroup, fetchUsers]);

    const selectedCity = city || 'Tất cả tỉnh thành';

    const sidebarWrapClass = sidebarOpen
        ? styles.sidebarWrap
        : `${styles.sidebarWrap} ${styles.sidebarWrapCollapsed}`;

    // ── Tách handler để tránh warning "Unexpected negated condition" (dòng 86, 224)
    const handleSidebarRailClick = () => setSidebarOpen(true);
    const handleSidebarRailKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') setSidebarOpen(true);
    };

    return (
        <div className={styles.page}>
            {name.trim() ? (
                <div className={styles.layout}>

                    {/* ── Sidebar wrapper ── */}
                    <div className={sidebarWrapClass}>

                        {/* Rail khi thu — thêm role/keyboard để fix accessibility warning (dòng 164) */}
                        {!sidebarOpen && (
                            <div
                                className={styles.sidebarRail}
                                onClick={handleSidebarRailClick}
                                onKeyDown={handleSidebarRailKeyDown}
                                role="button"
                                tabIndex={0}
                                title="Mở bộ lọc"
                            >
                                <IconFilter size={14}/>
                            </div>
                        )}

                        {/* Nội dung khi mở */}
                        {sidebarOpen && (
                            <div className={styles.sidebarContent}>

                                <div className={styles.filterBlock}>
                                    <div className={styles.filterBlockHeader}>
                                        <button
                                            type="button"
                                            className={styles.filterToggleBtn}
                                            onClick={() => setSidebarOpen(false)}
                                            title="Đóng bộ lọc"
                                        >
                                            <IconFilter size={14}/>
                                        </button>
                                    </div>

                                    <button type="button" className={styles.collapseBtn}
                                            onClick={() => setGroupOpen(p => !p)}>
                                        <span>Mọi người</span>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                             className={groupOpen ? styles.chevronUp : styles.chevronDown}>
                                            <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                    </button>
                                    {groupOpen && (
                                        <div className={styles.filterList}>
                                            {FILTER_TABS.map(tab => (
                                                <button key={tab.key} type="button"
                                                        className={`${styles.filterItem} ${filterGroup === tab.key ? styles.filterItemActive : ''}`}
                                                        onClick={() => setFilterGroup(tab.key)}>
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.filterBlock} ref={cityDropdownRef}>
                                    <button type="button" className={styles.collapseBtn}
                                            onClick={() => setCityOpen(p => !p)}>
                                        <span className={city ? styles.citySelected : ''}>{selectedCity}</span>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                             className={cityOpen ? styles.chevronUp : styles.chevronDown}>
                                            <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                    </button>
                                    {cityOpen && (
                                        <div className={styles.cityDropdown}>
                                            <button type="button"
                                                    className={`${styles.cityOption} ${!city ? styles.cityOptionActive : ''}`}
                                                    onClick={() => {
                                                        setCity('');
                                                        setCityOpen(false);
                                                    }}>
                                                Tất cả tỉnh thành
                                            </button>
                                            {provinces.map(p => (
                                                <button key={p} type="button"
                                                        className={`${styles.cityOption} ${city === p ? styles.cityOptionActive : ''}`}
                                                        onClick={() => {
                                                            setCity(p);
                                                            setCityOpen(false);
                                                        }}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}
                    </div>

                    {/* ── Content ── */}
                    <main className={styles.content}>
                        <div className={styles.results}>
                            {/* Tách ternary lồng nhau thành biến để fix warning dòng 254 */}
                            {(() => {
                                if (initialLoad) {
                                    return Array.from({length: 6}, (_, i) => <SkeletonCard key={i}/>);
                                }
                                if (users.length === 0) {
                                    return (
                                        <div className={styles.empty}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                                                 stroke="#9CA3AF" strokeWidth="1.5">
                                                <circle cx="11" cy="11" r="8"/>
                                                <path d="m21 21-4.35-4.35"/>
                                            </svg>
                                            <p>Không tìm thấy người dùng nào</p>
                                        </div>
                                    );
                                }
                                return users.map(user => <UserCard key={user.userId} user={user}/>);
                            })()}
                        </div>

                        <div ref={loaderRef} style={{height: 1}}/>
                        {loading && !initialLoad && (
                            <div className={styles.loadMore}>
                                <div className={styles.spinner}/>
                            </div>
                        )}
                    </main>
                </div>
            ) : (
                <div className={styles.hint}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <p>Nhập tên trên thanh tìm kiếm để tìm người dùng</p>
                </div>
            )}
        </div>
    );
}