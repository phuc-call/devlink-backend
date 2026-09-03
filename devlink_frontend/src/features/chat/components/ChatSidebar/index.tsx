import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Edit } from 'lucide-react';
import { followApi, type FollowResponse } from '../../../../api/user-service/followApi';
import type { SelectedUser } from '../ChatArea';
import styles from './ChatSidebar.module.css';

type FilterType = 'ALL Chat' | 'FOLLOWING' | 'FOLLOWERS' | 'FRIENDS';

interface ChatSidebarProps {
    onSelectUser: (user: SelectedUser) => void;
    selectedUserId: number | null;
}

export default function ChatSidebar({ onSelectUser, selectedUserId }: ChatSidebarProps) {
    const [filter, setFilter] = useState<FilterType>('ALL Chat');
    const [users, setUsers] = useState<FollowResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filterRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [hasDragged, setHasDragged] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!filterRef.current) return;
        setIsDragging(true);
        setHasDragged(false);
        setStartX(e.pageX - filterRef.current.offsetLeft);
        setScrollLeft(filterRef.current.scrollLeft);
    };

    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !filterRef.current) return;
        e.preventDefault();
        const x = e.pageX - filterRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        if (Math.abs(walk) > 5) setHasDragged(true);
        filterRef.current.scrollLeft = scrollLeft - walk;
    };

    const observer = useRef<IntersectionObserver | null>(null);

    const loadUsers = async (currentPage: number, currentFilter: FilterType) => {
        setLoading(true);
        try {
            // Ánh xạ "ALL Chat" sang "FRIENDS" để gọi API theo yêu cầu lấy danh sách theo /me/follows
            const apiType = currentFilter === 'ALL Chat' ? 'FRIENDS' : currentFilter;
            const res = await followApi.getFollowList(apiType as any, currentPage, 20);
            const data = res.data.data;

            if (currentPage === 0) {
                setUsers(data.content);
            } else {
                setUsers(prev => [...prev, ...data.content]);
            }
            setHasMore(data.hasNext);
        } catch (error) {
            console.error('Lỗi khi tải danh sách người dùng:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(0);
        setHasMore(true);
        loadUsers(0, filter);
    }, [filter]);

    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => {
                    const nextPage = prev + 1;
                    loadUsers(nextPage, filter);
                    return nextPage;
                });
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, filter]);

    const getInitials = (name: string) => {
        return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
    };

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                {!isSearchOpen ? (
                    <>
                        <h2 className={styles.title}>Chats</h2>
                        <div className={styles.headerActions}>
                            <button className={styles.iconBtn} onClick={() => setIsSearchOpen(true)} title="Search">
                                <Search size={18} />
                            </button>
                            <button className={styles.iconBtn} title="New message">
                                <Edit size={18} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.searchBoxExpanded}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <button className={styles.closeSearchBtn} onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}>
                            ✕
                        </button>
                    </div>
                )}
            </div>

            <div 
                className={styles.filterWrapper}
                ref={filterRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                {['ALL Chat', 'FRIENDS', 'FOLLOWING', 'FOLLOWERS'].map(f => (
                    <button 
                        key={f}
                        className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                        onClick={(e) => {
                            if (hasDragged) {
                                e.preventDefault();
                                return;
                            }
                            setFilter(f as FilterType);
                        }}
                    >
                        {f === 'ALL Chat' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            <div className={styles.list}>
                {users.map((user, index) => {
                    const isLast = index === users.length - 1;
                    return (
                        <div
                            key={`${user.userId}-${index}`}
                            className={`${styles.item} ${selectedUserId === user.userId ? styles.active : ''}`}
                            ref={isLast ? lastElementRef : null}
                            onClick={() => onSelectUser({ userId: user.userId, fullName: user.fullName, avatar: user.avatar })}
                        >
                            {user.avatar ? (
                                <img src={user.avatar} alt="avatar" className={styles.avatar} />
                            ) : (
                                <div className={styles.avatarInitials}>{getInitials(user.fullName)}</div>
                            )}
                            <div className={styles.itemContent}>
                                <div className={styles.itemName}>{user.fullName}</div>
                            </div>
                        </div>
                    );
                })}

                {loading && <div className={styles.loading}>Loading...</div>}

                {!loading && users.length === 0 && (
                    <div className={styles.empty}>No conversations found.</div>
                )}
            </div>
        </div>
    );
}
