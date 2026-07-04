import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userProfileApi } from '../../../api/user-service/userProfileApi';
import { groupApi } from '../../../api/user-service/groupApi';
import { getCurrentUserInfo } from '../../../utils/auth';
import { Plus, Key } from 'lucide-react';

import type { UserSearchResponse } from '../../../types/profile.types';
import type { GroupSearchResponse } from '../../../types/group.types';
import styles from './ExplorePage.module.css';

import { JoinGroupModal } from '../components/ExploreModals';
import { UserCard, GroupCard, SkeletonCard } from '../components/ExploreCards';

type FilterGroup = 'all' | 'friends' | 'followers' | 'following';

const FILTER_TABS: ReadonlyArray<{ readonly key: FilterGroup; readonly label: string }> = [
    { key: 'all', label: 'Tất cả' },
    { key: 'friends', label: 'Bạn bè' },
    { key: 'followers', label: 'Người theo dõi' },
    { key: 'following', label: 'Đang theo dõi' },
];

interface IconFilterProps {
    readonly size?: number;
}

function IconFilter({ size = 15 }: IconFilterProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
}

export default function ExplorePage() {
    const [searchParams] = useSearchParams();

    const name = useMemo(() => searchParams.get('name') ?? '', [searchParams]);

    const [searchType, setSearchType] = useState<'users' | 'groups'>('users');
    const [city, setCity] = useState('');
    const [filterGroup, setFilterGroup] = useState<FilterGroup>('all');
    const [provinces, setProvinces] = useState<string[]>([]);

    const [currentUser, setCurrentUser] = useState<{ userName: string; avatar: string | null } | null>(null);

    useEffect(() => {
        userProfileApi.getProfile()
            .then(res => {
                const data = res.data.data;
                setCurrentUser({
                    userName: data.fullName,
                    avatar: data.avatarUrl || null
                });
            })
            .catch(err => console.error(err));
    }, []);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [groupOpen, setGroupOpen] = useState(true);
    const [cityOpen, setCityOpen] = useState(false);
    const cityDropdownRef = useRef<HTMLDivElement>(null);

    const [users, setUsers] = useState<UserSearchResponse[]>([]);
    const [groups, setGroups] = useState<GroupSearchResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    const [joinGroupModal, setJoinGroupModal] = useState(false);

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

    const fetchData = useCallback(async (
        searchName: string, searchCity: string, groupFilter: FilterGroup,
        sType: 'users' | 'groups', pageNum: number, reset: boolean
    ) => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setLoading(true);
        try {
            if (sType === 'users') {
                if (!searchName.trim()) {
                    setUsers([]);
                    setHasMore(false);
                    return;
                }
                const res = await userProfileApi.searchUsers({
                    name: searchName.trim(),
                    city: searchCity || undefined,
                    friendsOnly: groupFilter === 'friends',
                    followersOnly: groupFilter === 'followers',
                    followingOnly: groupFilter === 'following',
                    page: pageNum, size: 20,
                });
                const data = res.data.data;
                setUsers(prev => reset ? data.users.content : [...prev, ...data.users.content]);
                setHasMore(!data.users.last);
            } else {
                let res;
                if (!searchName.trim()) {
                    res = await groupApi.getRecommendedGroups(pageNum, 20);
                } else {
                    res = await groupApi.searchGroups(searchName.trim(), pageNum, 20);
                }
                const data = res.data.data;
                setGroups(prev => reset ? data.content : [...prev, ...data.content]);
                setHasMore(!data.last);
            }
            setPage(pageNum);
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== 'CanceledError') console.error(err);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    }, []);

    useEffect(() => {
        if (searchType === 'users' && !name.trim()) {
            setUsers([]);
            setHasMore(false);
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUsers([]);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGroups([]);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPage(0);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasMore(true);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInitialLoad(true);
        void fetchData(name, city, filterGroup, searchType, 0, true);
    }, [name, city, filterGroup, searchType, fetchData]);

    useEffect(() => {
        const el = loaderRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loading && !initialLoad)
                void fetchData(name, city, filterGroup, searchType, page + 1, false);
        }, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading, initialLoad, page, name, city, filterGroup, searchType, fetchData]);

    const selectedCity = city || 'Tất cả tỉnh thành';

    const navigate = useNavigate();

    return (
        <div className={styles.page}>
            <div className={styles.topActions}>
                <div className={styles.typeTabs}>
                    <button
                        className={`${styles.typeTab} ${searchType === 'users' ? styles.typeTabActive : ''}`}
                        onClick={() => setSearchType('users')}
                    >
                        Người dùng
                    </button>
                    <button
                        className={`${styles.typeTab} ${searchType === 'groups' ? styles.typeTabActive : ''}`}
                        onClick={() => setSearchType('groups')}
                    >
                        Nhóm
                    </button>
                </div>
                {searchType === 'groups' && (
                    <div className={styles.headerBtns}>
                        <div className={styles.currentUserInfo}>
                            {currentUser?.avatar ? (
                                <img src={currentUser.avatar} alt={currentUser.userName} className={styles.currentUserAvatar} />
                            ) : (
                                <div className={styles.currentUserAvatarPlaceholder}>
                                    {currentUser?.userName?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className={styles.currentUserName}>{currentUser?.userName}</span>
                        </div>
                        <div className={styles.groupActionBtns}>
                            <button className={styles.btnCreateGroup} onClick={() => navigate('/groups/create')}>
                                <Plus size={16} /> Tạo nhóm mới
                            </button>
                            <button className={styles.btnJoinGroup} onClick={() => setJoinGroupModal(true)}>
                                <Key size={16} /> Tham gia bằng mã
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {name.trim() || searchType === 'groups' ? (
                <div className={styles.layout}>
                    <main className={styles.contentFull}>
                        <div className={styles.results}>
                            {(() => {
                                if (initialLoad) {
                                    return Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />);
                                }
                                if (searchType === 'users' && users.length === 0) {
                                    return (
                                        <div className={styles.empty}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                                                <circle cx="11" cy="11" r="8" />
                                                <path d="m21 21-4.35-4.35" />
                                            </svg>
                                            <p>Không tìm thấy người dùng nào</p>
                                        </div>
                                    );
                                }
                                if (searchType === 'groups' && groups.length === 0) {
                                    return (
                                        <div className={styles.empty}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                            </svg>
                                            <p>Không tìm thấy nhóm nào</p>
                                        </div>
                                    );
                                }
                                if (searchType === 'users') {
                                    return users.map(user => <UserCard key={user.userId} user={user} />);
                                } else {
                                    return groups.map(group => <GroupCard key={group.id} group={group} />);
                                }
                            })()}
                        </div>

                        <div ref={loaderRef} style={{ height: 1 }} />
                        {loading && !initialLoad && (
                            <div className={styles.loadMore}>
                                <div className={styles.spinner} />
                            </div>
                        )}
                    </main>
                </div>
            ) : (
                <div className={styles.hint}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <p>Nhập tên trên thanh tìm kiếm để khám phá</p>
                </div>
            )}

            {joinGroupModal && <JoinGroupModal onClose={() => setJoinGroupModal(false)} onSuccess={() => void fetchData(name, city, filterGroup, searchType, 0, true)} />}
        </div>
    );
}