import { CHAT_FILTER_TYPES, CONVERSATION_TYPES } from '../../../../constants/chat';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Edit, MoreHorizontal, Check } from 'lucide-react';
import { followApi, type FollowResponse } from '../../../../api/user-service/followApi';
import { chatApi } from '../../../../api/chat-service/chatApi';
import { useConversations } from '../../hooks/useConversations';
import type { SelectedUser } from '../ChatArea';
import { db } from '../../../../utils/db';
import styles from './ChatSidebar.module.css';

type FilterType = 'ALL Chat' | 'FOLLOWING' | 'FOLLOWERS' | 'FRIENDS';

interface ChatSidebarProps {
    onSelectUser: (user: SelectedUser) => void;
    selectedUserId: number | null;
}

export default function ChatSidebar({ onSelectUser, selectedUserId }: ChatSidebarProps) {
    const [filter, setFilter] = useState<FilterType>(CHAT_FILTER_TYPES.ALL);
    const [menuOpenConvId, setMenuOpenConvId] = useState<number | null>(null);
    const [hoveredConvId, setHoveredConvId] = useState<number | null>(null);
    const [users, setUsers] = useState<FollowResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handleClickOutside = () => setMenuOpenConvId(null);
        if (menuOpenConvId) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [menuOpenConvId]);

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

    const { conversations, isLoading: convLoading } = useConversations();

    const loadUsers = async (currentPage: number, currentFilter: FilterType) => {
        setLoading(true);
        try {
            // Ánh xạ "ALL Chat" sang "FRIENDS" để gọi API theo yêu cầu lấy danh sách theo /me/follows
            const apiType = currentFilter === CHAT_FILTER_TYPES.ALL ? CHAT_FILTER_TYPES.FRIENDS : currentFilter;
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

    const formatTime = (isoString?: string | null) => {
        if (!isoString) return '';
        // Add 'Z' if missing to parse as UTC
        const dateStr = isoString.endsWith('Z') ? isoString : isoString + 'Z';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0 && now.getDate() === date.getDate()) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }
        if (diffDays < 7) {
            return date.toLocaleDateString('vi-VN', { weekday: 'short' });
        }
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
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
                {[CHAT_FILTER_TYPES.ALL, CHAT_FILTER_TYPES.FRIENDS, CHAT_FILTER_TYPES.FOLLOWING, CHAT_FILTER_TYPES.FOLLOWERS].map(f => (
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
                        {f === CHAT_FILTER_TYPES.ALL ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            <div className={styles.list}>
                {filter === CHAT_FILTER_TYPES.ALL ? (
                    <>
                        {convLoading && <div className={styles.loading}>Loading chats...</div>}
                        {!convLoading && conversations.length === 0 && (
                            <div className={styles.empty}>No conversations yet.</div>
                        )}
                        {conversations.map((conv, index) => {
                            const isDirect = conv.type === CONVERSATION_TYPES.DIRECT;
                            const targetId = isDirect ? conv.otherUserId : conv.groupId;
                            const title = isDirect ? conv.otherUserName : conv.groupName;
                            const avatar = isDirect ? conv.otherUserAvatar : conv.groupAvatar;
                            const isActive = isDirect ? selectedUserId === targetId : false;

                            const unreadCount = conv.countUnreadMessages || 0;
                            const lastMsg = conv.lastMessageContent || (conv.lastMessageType === 'SYSTEM' ? 'System message' : '');

                            return (
                                <div
                                    key={`conv-${conv.id}-${index}`}
                                    className={`${styles.item} ${isActive ? styles.active : ''}`}
                                    onMouseEnter={() => setHoveredConvId(conv.id)}
                                    onMouseLeave={() => setHoveredConvId(null)}
                                    onClick={() => {
                                        if (isDirect && targetId && title) {
                                            onSelectUser({ conversationId: conv.id, userId: targetId, fullName: title, avatar: avatar });
                                        }
                                    }}
                                    style={{ position: 'relative', zIndex: menuOpenConvId === conv.id ? 50 : 1 }}
                                >
                                    {avatar ? (
                                        <img src={avatar} alt="avatar" className={styles.avatar} />
                                    ) : (
                                        <div className={styles.avatarInitials}>{title ? getInitials(title) : '?'}</div>
                                    )}
                                    <div className={styles.itemContent} style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, paddingRight: 4 }}>
                                                <div className={styles.itemName} style={{ flex: 1, minWidth: 0 }}>
                                                    {title}
                                                </div>
                                                {unreadCount > 0 && <span className={styles.unreadBadge} style={{ flexShrink: 0, marginLeft: 4 }}>{unreadCount}</span>}
                                            </div>
                                            {conv.lastMessageAt && (
                                                <span style={{ fontSize: '11px', color: unreadCount > 0 ? '#3B82F6' : '#65676B', flexShrink: 0, fontWeight: unreadCount > 0 ? 600 : 'normal' }}>
                                                    {formatTime(conv.lastMessageAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.lastMessage} style={{ fontSize: '12px', color: unreadCount > 0 ? '#111827' : '#65676B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unreadCount > 0 ? 600 : 'normal' }}>
                                            {conv.isLastMessageRecalled ? 'Message unsent' : lastMsg}
                                        </div>
                                    </div>

                                    {/* 3-dot menu */}
                                    {(hoveredConvId === conv.id || menuOpenConvId === conv.id) && (
                                        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpenConvId(menuOpenConvId === conv.id ? null : conv.id);
                                                }}
                                                style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                <MoreHorizontal size={16} color="#4B5563" />
                                            </button>

                                            {menuOpenConvId === conv.id && (
                                                <div style={{
                                                    position: 'absolute', right: 0, top: 32, zIndex: 10,
                                                    background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '4px 0', minWidth: '130px'
                                                }}>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                await chatApi.markConversationAsRead(conv.id);
                                                                db.conversations.update(conv.id, { countUnreadMessages: 0 });
                                                            } catch (err) {
                                                                console.error("Failed to mark as read", err);
                                                            }
                                                            setMenuOpenConvId(null);
                                                        }}
                                                        style={{
                                                            width: '100%', display: 'flex', alignItems: 'center',
                                                            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                                                            fontSize: '0.875rem', color: '#1F2937', textAlign: 'left',
                                                            whiteSpace: 'nowrap', transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        Đánh dấu đã đọc
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                ) : (
                    <>
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
                            <div className={styles.empty}>No users found.</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
