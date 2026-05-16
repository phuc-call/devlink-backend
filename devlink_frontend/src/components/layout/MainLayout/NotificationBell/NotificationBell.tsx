// src/components/layout/MainLayout/Header/NotificationBell.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../../../api/user-service/notificationApi';
import { followApi } from '../../../../api/user-service/followApi';
import type { NotificationResponse } from '../../../../types/notification.types';
import styles from './NotificationBell.module.css';

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} ngày trước`;
    if (h > 0) return `${h} giờ trước`;
    if (m > 0) return `${m} phút trước`;
    return 'Vừa xong';
}

function NotificationIcon({ type }: { type: string }) {
    if (type === 'BIRTHDAY') return <span className={styles.typeIcon}>🎂</span>;
    if (type === 'FOLLOW_BACK') return <span className={styles.typeIcon}>🤝</span>;
    if (type === 'FOLLOW_REQUEST') return <span className={styles.typeIcon}>👋</span>;
    return <span className={styles.typeIcon}>👤</span>;
}

interface NotificationItemProps {
    notification: NotificationResponse;
    onRead: (id: number) => void;
}

function NotificationItem({ notification, onRead }: NotificationItemProps) {
    const navigate = useNavigate();
    const [followed, setFollowed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleClick = () => {
        if (!notification.isRead) onRead(notification.id);
        navigate(`/profile/${notification.actorId}`);
    };

    const handleFollow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (loading || followed) return;
        setLoading(true);
        try {
            await followApi.followUser(notification.actorId);
            setFollowed(true);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    const showFollowBtn = notification.type === 'FOLLOW_REQUEST' || notification.type === 'FOLLOW';
    const isFriend = notification.type === 'FOLLOW_BACK';

    return (
        <div
            className={`${styles.item} ${!notification.isRead ? styles.unread : ''}`}
            onClick={handleClick}
        >
            <div className={styles.avatarWrap}>
                {notification.actorAvatar
                    ? <img src={notification.actorAvatar} alt={notification.actorName} className={styles.avatar} />
                    : <span className={styles.avatarFallback}>?</span>
                }
                <NotificationIcon type={notification.type} />
            </div>

            <div className={styles.body}>
                <p className={styles.content}>{notification.content}</p>
                <span className={styles.time}>{timeAgo(notification.createdAt)}</span>
            </div>

            <div className={styles.action}>
                {!notification.isRead && <span className={styles.dot} />}
                {isFriend && (
                    <span className={styles.friendBadge}>Bạn bè</span>
                )}
                {showFollowBtn && !isFriend && (
                    <button
                        type="button"
                        className={`${styles.followBtn} ${followed ? styles.followedBtn : ''}`}
                        onClick={handleFollow}
                        disabled={loading || followed}
                    >
                        {followed ? 'Đã theo dõi' : 'Theo dõi'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Poll unread count mỗi 30s
    useEffect(() => {
        const fetchCount = () => {
            notificationApi.getUnreadCount()
                .then(res => setUnread(res.data.data))
                .catch(() => {});
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Đóng khi click ngoài
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await notificationApi.getNotifications(0, 20);
            setNotifications(res.data.data.content);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    const handleOpen = () => {
        setOpen(p => {
            if (!p) fetchNotifications();
            return !p;
        });
    };

    const handleRead = async (id: number) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnread(prev => Math.max(0, prev - 1));
        } catch {
            // ignore
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnread(0);
        } catch {
            // ignore
        }
    };

    return (
        <div className={styles.wrap} ref={panelRef}>
            {/* Icon chuông + badge */}
            <button
                type="button"
                className={styles.bellBtn}
                onClick={handleOpen}
                title="Thông báo"
                aria-label="Thông báo"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unread > 0 && (
                    <span className={styles.badge}>
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <span className={styles.panelTitle}>Thông báo</span>
                        {unread > 0 && (
                            <button
                                type="button"
                                className={styles.markAllBtn}
                                onClick={handleMarkAllRead}
                            >
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    <div className={styles.list}>
                        {loading && (
                            <div className={styles.loadingWrap}>
                                <div className={styles.spinner} />
                            </div>
                        )}
                        {!loading && notifications.length === 0 && (
                            <div className={styles.empty}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                     stroke="#9CA3AF" strokeWidth="1.5">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                </svg>
                                <p>Chưa có thông báo nào</p>
                            </div>
                        )}
                        {!loading && notifications.map(n => (
                            <NotificationItem
                                key={n.id}
                                notification={n}
                                onRead={handleRead}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}