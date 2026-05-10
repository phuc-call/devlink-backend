import { useEffect, useRef, useState, useCallback } from 'react';
import axiosInstance from '../../../../api/axiosInstance';
import type { PageResponse } from '../../../../types/common.types';
import styles from './FollowListPanel.module.css';

type FollowListType = 'FOLLOWING' | 'FOLLOWERS' | 'FRIENDS';

interface FollowUser {
    userId: number;
    fullName: string;
    avatar?: string;
    status: string;
}

interface Props {
    initialTab?: FollowListType;
    onTabChange?: (tab: FollowListType) => void;
}

const TAB_LABELS: { type: FollowListType; label: string }[] = [
    { type: 'FOLLOWING', label: 'Following' },
    { type: 'FOLLOWERS', label: 'Followers' },
    { type: 'FRIENDS', label: 'Friends' },
];

const PAGE_SIZE = 20;

function getInitials(name?: string) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
}

export default function FollowListPanel({ initialTab = 'FOLLOWING', onTabChange }: Props) {
    const [activeTab, setActiveTab] = useState<FollowListType>(initialTab);
    const [items, setItems] = useState<FollowUser[]>([]);
    const [page, setPage] = useState(0);
    const [hasNext, setHasNext] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const loaderRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const fetchPage = useCallback(async (tab: FollowListType, pageNum: number, reset = false) => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        setLoading(true);
        try {
            const res = await axiosInstance.get<{ data: PageResponse<FollowUser> }>(
                '/api/users/me/follows',
                { params: { type: tab, page: pageNum, size: PAGE_SIZE }, signal: abortRef.current.signal }
            );
            const data = res.data.data;
            setItems(prev => reset ? data.content : [...prev, ...data.content]);
            setHasNext(data.hasNext);
            setPage(pageNum);
        } catch (e: any) {
            if (e?.name !== 'CanceledError') console.error(e);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    }, []);

    useEffect(() => {
        setItems([]);
        setPage(0);
        setHasNext(true);
        setInitialLoad(true);
        fetchPage(activeTab, 0, true);
    }, [activeTab, fetchPage]);

    useEffect(() => {
        const el = loaderRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNext && !loading) {
                fetchPage(activeTab, page + 1, false);
            }
        }, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNext, loading, page, activeTab, fetchPage]);

    const handleTabChange = (tab: FollowListType) => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.tabBar}>
                {TAB_LABELS.map(({ type, label }) => (
                    <button
                        key={type}
                        className={`${styles.tab} ${activeTab === type ? styles.tabActive : ''}`}
                        onClick={() => handleTabChange(type)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {initialLoad ? (
                <div className={styles.grid}>
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : items.length === 0 ? (
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>👥</span>
                    <p className={styles.emptyText}>Chưa có ai ở đây</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {items.map(user => <UserCard key={user.userId} user={user} />)}
                </div>
            )}

            <div ref={loaderRef} style={{ height: 1 }} />
            {loading && !initialLoad && (
                <div className={styles.loadMore}>
                    <div className={styles.spinner} />
                </div>
            )}
        </div>
    );
}

function UserCard({ user }: { user: FollowUser }) {
    return (
        <div className={styles.card}>
            <div className={styles.avatarWrap}>
                {user.avatar
                    ? <img src={user.avatar} alt={user.fullName} className={styles.avatar} />
                    : <div className={styles.avatarFallback}>{getInitials(user.fullName)}</div>
                }
            </div>
            <div className={styles.info}>
                <p className={styles.name}>{user.fullName || 'Người dùng'}</p>
            </div>
            <button className={styles.btn}>Xem</button>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className={`${styles.card} ${styles.skeleton}`}>
            <div className={`${styles.avatarWrap} ${styles.skeletonCircle}`} />
            <div className={styles.info}>
                <div className={styles.skeletonLine} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            </div>
        </div>
    );
}