import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeOff, Bell, MessageSquare, FileText, Lock } from 'lucide-react';
import { notificationApi } from '../../../api/user-service/notificationApi';
import type { NotificationResponse } from '../../../types/notification.types';
import { HiddenNotificationItem } from '../../notification/components/Hiddennotificationsection';
import styles from './HiddenContentPage.module.css';

type Tab = 'notifications' | 'messages' | 'posts';

export default function HiddenContentPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('notifications');
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if unlocked
        const isUnlocked = sessionStorage.getItem('hidden_unlocked');
        if (!isUnlocked) {
            navigate('/notifications');
            return;
        }

        fetchHiddenNotifications();
    }, [navigate]);

    const fetchHiddenNotifications = async () => {
        setLoading(true);
        try {
            const res = await notificationApi.getNotifications(0, 50);
            setNotifications(
                res.data.data.content.filter((n: NotificationResponse) => n.isHidden)
            );
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    const lockAgain = () => {
        sessionStorage.removeItem('hidden_unlocked');
        navigate('/notifications');
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <div className={styles.titleWrap}>
                    <div className={styles.iconWrap}>
                        <Lock size={20} strokeWidth={2.2} />
                    </div>
                    <h1 className={styles.pageTitle}>Khu vực bảo mật</h1>
                </div>
                <button onClick={lockAgain} className={styles.lockBtn}>
                    <Lock size={16} strokeWidth={2} /> Khóa lại
                </button>
            </div>

            <p className={styles.pageDesc}>
                Tất cả các nội dung bị ẩn sẽ hiển thị tại đây. Vui lòng khóa lại khi không còn sử dụng.
            </p>

            {/* TABS */}
            <div className={styles.tabsRow}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'notifications' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('notifications')}
                >
                    <Bell size={18} strokeWidth={2} /> Thông báo
                </button>
                {/* <button
                    className={`${styles.tabBtn} ${activeTab === 'messages' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('messages')}
                >
                    <MessageSquare size={18} strokeWidth={2} /> Tin nhắn
                </button> */}
                <button
                    className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    <FileText size={18} strokeWidth={2} /> Bài viết
                </button>
            </div>

            {/* TAB CONTENT */}
            <div className={styles.contentArea}>
                {activeTab === 'notifications' && (
                    <>
                        {loading && (
                            <div className={styles.loadingWrap}>
                                <div className={styles.spinner} />
                                <p>Đang tải thông báo ẩn...</p>
                            </div>
                        )}
                        {!loading && notifications.length === 0 && (
                            <div className={styles.empty}>
                                <EyeOff size={40} strokeWidth={1.5} color="#D1D5DB" />
                                <p className={styles.emptyTitle}>Không có thông báo ẩn</p>
                                <p className={styles.emptyDesc}>Những thông báo bạn ẩn sẽ xuất hiện tại đây.</p>
                            </div>
                        )}
                        {!loading && notifications.map(n => (
                            <HiddenNotificationItem
                                key={n.id}
                                n={n}
                                onRefresh={fetchHiddenNotifications}
                            />
                        ))}
                    </>
                )}

                {activeTab === 'messages' && (
                    <div className={styles.empty}>
                        <MessageSquare size={40} strokeWidth={1.5} color="#D1D5DB" />
                        <p className={styles.emptyTitle}>Tin nhắn đã ẩn</p>
                        <p className={styles.emptyDesc}>Tính năng đang được phát triển.</p>
                    </div>
                )}

                {activeTab === 'posts' && (
                    <div className={styles.empty}>
                        <FileText size={40} strokeWidth={1.5} color="#D1D5DB" />
                        <p className={styles.emptyTitle}>Bài viết đã ẩn</p>
                        <p className={styles.emptyDesc}>Tính năng đang được phát triển.</p>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
