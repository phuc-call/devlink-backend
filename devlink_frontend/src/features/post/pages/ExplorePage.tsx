import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userProfileApi } from '../../../api/user-service/userProfileApi';
import { groupApi } from '../../../api/user-service/groupApi';
import { Search, Users, Globe, LayoutGrid } from 'lucide-react';

import type { UserSearchResponse } from '../../../types/profile.types';
import type { GroupSearchResponse } from '../../../types/group.types';
import styles from './ExplorePage.module.css';

import { UserCard, GroupCard, SkeletonCard } from '../components/ExploreCards';

type SearchTab = 'all' | 'users' | 'groups';
type FilterGroup = 'all' | 'friends' | 'followers' | 'following';

export default function ExplorePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const name = useMemo(() => searchParams.get('name') ?? '', [searchParams]);
    const [activeTab, setActiveTab] = useState<SearchTab>('all');
    
    // Filters
    const [city, setCity] = useState('');
    const [filterGroup, setFilterGroup] = useState<FilterGroup>('all');


    // Data
    const [specialUsers, setSpecialUsers] = useState<UserSearchResponse[]>([]);
    const [users, setUsers] = useState<UserSearchResponse[]>([]);
    const [groups, setGroups] = useState<GroupSearchResponse[]>([]);

    // Pagination
    const [usersPage, setUsersPage] = useState(0);
    const [usersHasMore, setUsersHasMore] = useState(true);
    const [usersInitialLoad, setUsersInitialLoad] = useState(true);

    const [groupsPage, setGroupsPage] = useState(0);
    const [groupsHasMore, setGroupsHasMore] = useState(true);
    const [groupsInitialLoad, setGroupsInitialLoad] = useState(true);

    const [loading, setLoading] = useState(false);
    const loaderRef = useRef<HTMLDivElement>(null);
    const cityRef = useRef<HTMLDivElement>(null);

    // Fetch Provinces
    useEffect(() => {
        userProfileApi.getProvinces()
            .then(() => {}) // keep the call or remove entirely? I will just remove the whole useEffect.
            .catch(() => {});
            
        const handleClickOutside = (e: MouseEvent) => {
            if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
                // do nothing
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Special Accounts (only when no search query)
    useEffect(() => {
        if (!name.trim()) {
            userProfileApi.getSpecialRecommendations()
                .then(res => {
                    const mapped = res.data.data.map(u => ({
                        userId: u.id,
                        fullName: u.fullName,
                        avatarUrl: u.avatar ?? undefined
                    }));
                    setSpecialUsers(mapped);
                })
                .catch(() => setSpecialUsers([]));
        } else {
            setSpecialUsers([]);
        }
    }, [name]);

    // Fetch Logic
    const fetchUsers = useCallback(async (pageNum: number, reset: boolean) => {
        setLoading(true);
        try {
            if (!name.trim()) {
                if (reset) {
                    const res = await userProfileApi.getNormalRecommendations();
                    const mapped = res.data.data.map(u => ({
                        userId: u.id,
                        fullName: u.fullName,
                        avatarUrl: u.avatar ?? undefined
                    }));
                    setUsers(mapped);
                }
                setUsersHasMore(false);
                setUsersPage(0);
            } else {
                const res = await userProfileApi.searchUsers({
                    name: name.trim(),
                    city: city || undefined,
                    friendsOnly: filterGroup === 'friends',
                    followersOnly: filterGroup === 'followers',
                    followingOnly: filterGroup === 'following',
                    page: pageNum, size: 20,
                });
                const data = res.data.data;
                setUsers(prev => reset ? data.users.content : [...prev, ...data.users.content]);
                setUsersHasMore(!data.users.last);
                setUsersPage(pageNum);
            }
        } catch (err) {
            setUsersHasMore(false);
        } finally {
            setLoading(false);
            setUsersInitialLoad(false);
        }
    }, [name, city, filterGroup]);

    const fetchGroups = useCallback(async (pageNum: number, reset: boolean) => {
        setLoading(true);
        try {
            let res;
            if (!name.trim()) {
                res = await groupApi.getRecommendedGroups(pageNum, 20);
            } else {
                res = await groupApi.searchGroups(name.trim(), pageNum, 20);
            }
            const data = res.data.data;
            setGroups(prev => reset ? data.content : [...prev, ...data.content]);
            setGroupsHasMore(!data.last);
            setGroupsPage(pageNum);
        } catch (err) {
            setGroupsHasMore(false);
        } finally {
            setLoading(false);
            setGroupsInitialLoad(false);
        }
    }, [name]);

    // Reset and fetch on criteria change
    useEffect(() => {
        setUsers([]);
        setGroups([]);
        setUsersPage(0);
        setGroupsPage(0);
        setUsersHasMore(true);
        setGroupsHasMore(true);
        setUsersInitialLoad(true);
        setGroupsInitialLoad(true);

        void fetchUsers(0, true);
        void fetchGroups(0, true);
    }, [fetchUsers, fetchGroups]);

    // Infinite Scroll
    useEffect(() => {
        const el = loaderRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !loading) {
                if (activeTab === 'all' || activeTab === 'users') {
                    if (usersHasMore && !usersInitialLoad) void fetchUsers(usersPage + 1, false);
                }
                if (activeTab === 'all' || activeTab === 'groups') {
                    if (groupsHasMore && !groupsInitialLoad) void fetchGroups(groupsPage + 1, false);
                }
            }
        }, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [loading, usersHasMore, groupsHasMore, usersInitialLoad, groupsInitialLoad, usersPage, groupsPage, activeTab, fetchUsers, fetchGroups]);

    const displayUsers = users;
    const displayGroups = groups;
    
    const isEmpty = users.length === 0 && groups.length === 0 && specialUsers.length === 0;
    const isLoadingInitial = usersInitialLoad || groupsInitialLoad;

    return (
        <div className={styles.page}>
            {/* Header Section */}
            <div className={styles.exploreHeader}>
                <div className={styles.exploreHeaderContent}>


                    {/* Tabs */}
                    <div className={styles.tabContainer}>
                        <button 
                            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            <LayoutGrid size={18} /> Tất cả
                        </button>
                        <button 
                            className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <Users size={18} /> Người dùng
                        </button>
                        <button 
                            className={`${styles.tabBtn} ${activeTab === 'groups' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('groups')}
                        >
                            <Globe size={18} /> Cộng đồng
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className={styles.mainLayout}>
                <div className={styles.contentArea}>
                    
                    {/* Filters bar removed as requested */}

                    {/* Loading State */}
                    {isLoadingInitial ? (
                        <div className={styles.gridContainer}>
                            {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : isEmpty ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <Search size={48} />
                            </div>
                            <h3>Không tìm thấy kết quả</h3>
                            <p>Thử tìm kiếm với một từ khóa khác hoặc xóa bớt bộ lọc</p>
                            <button onClick={() => { navigate('/explore'); setFilterGroup('all'); setCity(''); }} className={styles.clearFilterBtn}>
                                Xóa bộ lọc
                            </button>
                        </div>
                    ) : (
                        <div className={styles.resultsWrapper}>
                            
                            {/* SPECIAL USERS (Only visible on All or Users tab when no search) */}
                            {(activeTab === 'all' || activeTab === 'users') && specialUsers.length > 0 && (
                                <section className={styles.resultSection}>
                                    <div className={styles.gridContainer}>
                                        {specialUsers.map(user => <UserCard key={`special-${user.userId}`} user={user} verified={true} showFollow={true} />)}
                                    </div>
                                </section>
                            )}

                            {/* USERS */}
                            {(activeTab === 'all' || activeTab === 'users') && displayUsers.length > 0 && (
                                <section className={styles.resultSection}>
                                    <div className={styles.gridContainer}>
                                        {displayUsers.slice(0, activeTab === 'all' ? 6 : undefined).map(user => 
                                            <UserCard key={`user-${user.userId}`} user={user} showFollow={true} />
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* GROUPS */}
                            {(activeTab === 'all' || activeTab === 'groups') && displayGroups.length > 0 && (
                                <section className={styles.resultSection}>
                                    <div className={styles.groupGridContainer}>
                                        {displayGroups.slice(0, activeTab === 'all' ? 6 : undefined).map(group => 
                                            <GroupCard key={`group-${group.id}`} group={group} />
                                        )}
                                    </div>
                                </section>
                            )}

                        </div>
                    )}

                    <div ref={loaderRef} style={{ height: 1, marginTop: 24 }} />
                    {loading && !isLoadingInitial && (
                        <div className={styles.loadMore}>
                            <div className={styles.spinner} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}