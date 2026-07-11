import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userProfileApi } from '../../../api/user-service/userProfileApi';
import { followApi } from '../../../api/user-service/followApi';

import type { UserSearchResponse } from '../../../types/profile.types';
import styles from './FriendsPage.module.css';

import { UserCard, SkeletonCard } from '../components/ExploreCards';

// Search is client-side (filter already-loaded list)
export default function FriendsPage() {
    const { tab } = useParams<{ tab?: string }>();

    const [users, setUsers] = useState<UserSearchResponse[]>([]);
    const [allUsers, setAllUsers] = useState<UserSearchResponse[]>([]); // full list for search
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loaderRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    const activeTab = tab || 'suggestions';
    const showSearch = activeTab === 'my-friends' || activeTab === 'following' || activeTab === 'followers';

    const fetchUsers = useCallback(async (pageNum: number, reset: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            if (activeTab === 'suggestions') {
                if (reset) {
                    const res = await userProfileApi.getNormalRecommendations();
                    const mapped = res.data.data.map(u => ({
                        userId: u.id,
                        fullName: u.fullName,
                        avatarUrl: u.avatar || null,
                    }));
                    setUsers(mapped);
                    setAllUsers(mapped);
                }
                setHasMore(false);
                setPage(0);
            } else {
                const type =
                    activeTab === 'my-friends' ? 'FRIENDS' :
                    activeTab === 'following'  ? 'FOLLOWING' :
                    'FOLLOWERS';

                const res = await followApi.getFollowList(type, pageNum, 20);
                const data = res.data.data;
                const mapped = data.content.map(u => ({
                    userId: u.userId,
                    fullName: u.fullName,
                    avatarUrl: u.avatar || null,
                }));
                if (reset) {
                    setAllUsers(mapped);
                    setUsers(mapped);
                } else {
                    setAllUsers(prev => [...prev, ...mapped]);
                    setUsers(prev => [...prev, ...mapped]);
                }
                setHasMore(data.hasNext);
                setPage(pageNum);
            }
        } catch {
            setHasMore(false);
        } finally {
            setLoading(false);
            setInitialLoad(false);
            loadingRef.current = false;
        }
    }, [activeTab]);

    // Reset when tab changes
    useEffect(() => {
        setUsers([]);
        setAllUsers([]);
        setPage(0);
        setHasMore(false);
        setInitialLoad(true);
        setSearchQuery('');
        loadingRef.current = false;
        void fetchUsers(0, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Infinite scroll
    useEffect(() => {
        const el = loaderRef.current;
        if (!el || !hasMore || loading) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
                void fetchUsers(page + 1, false);
            }
        }, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading, page, fetchUsers]);

    // Client-side search filter
    useEffect(() => {
        if (!showSearch) return;
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            setUsers(allUsers);
        } else {
            setUsers(allUsers.filter(u => u.fullName?.toLowerCase().includes(q)));
        }
    }, [searchQuery, allUsers, showSearch]);

    const getSearchPlaceholder = () => {
        if (activeTab === 'my-friends') return 'Search friends...';
        if (activeTab === 'following') return 'Search following...';
        if (activeTab === 'followers') return 'Search followers...';
        return 'Search...';
    };

    return (
        <div className={styles.page}>
            <div className={styles.inner}>
                <div className={styles.header}>
                    {showSearch && (
                        <div className={styles.searchWrap}>
                            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder={getSearchPlaceholder()}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.list}>
                    {initialLoad ? (
                        Array.from({ length: 5 }, (_, i) => <SkeletonCard key={i} />)
                    ) : users.length > 0 ? (
                        users.map(user => (
                            <UserCard
                                key={user.userId}
                                user={user}
                                showFollow={activeTab === 'suggestions' || activeTab === 'followers'}
                            />
                        ))
                    ) : (
                        <div className={styles.empty}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <p>{searchQuery ? 'No results found' : 'Nothing here yet'}</p>
                        </div>
                    )}
                </div>

                {/* Infinite scroll trigger */}
                <div ref={loaderRef} style={{ height: 4 }} />
                {loading && !initialLoad && hasMore && (
                    <div className={styles.loadMore}>
                        <div className={styles.spinner} />
                    </div>
                )}
            </div>
        </div>
    );
}
