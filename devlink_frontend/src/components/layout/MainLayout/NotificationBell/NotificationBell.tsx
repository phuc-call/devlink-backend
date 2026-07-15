// src/components/layout/MainLayout/Header/NotificationBell.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Users, UserPlus, Cake, EyeOff, Eye, Trash2, MoreVertical,
    ShieldCheck, ShieldAlert, MessageCircle, Heart, // ← thêm 2 icon mới
} from 'lucide-react';
import { notificationApi } from '../../../../api/user-service/notificationApi';
import { followApi } from '../../../../api/user-service/followApi';
import ReportDetailModal from '../../../../features/notification/components/ReportDetailModal/ReportDetailModal';
import type { NotificationResponse } from '../../../../types/notification.types';
import { WS_EVENTS } from '../../../../constants/wsEvents';
import styles from './NotificationBell.module.css';

// ── Helpers ───────────────────────────────────────────────────────────
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

function getTypeIconColor(type: string): string {
    if (type === 'BIRTHDAY') return styles.iconBirthday;
    if (type === 'FOLLOW_BACK') return styles.iconFriend;
    if (type === 'REPORT_REVIEWED') return styles.iconReportReviewed;
    if (type === 'REPORT_VIOLATION') return styles.iconReportViolation;
    if (type === 'COMMENT') return styles.iconComment;
    if (type === 'REACTION') return styles.iconReaction;
    return styles.iconFollow;
}

function NotificationTypeIcon({ type }: { readonly type: string }) {
    if (type === 'BIRTHDAY') return <Cake size={11} strokeWidth={2} />;
    if (type === 'FOLLOW_BACK') return <Users size={11} strokeWidth={2} />;
    if (type === 'REPORT_REVIEWED') return <ShieldCheck size={11} strokeWidth={2} />;
    if (type === 'REPORT_VIOLATION') return <ShieldAlert size={11} strokeWidth={2} />;
    if (type === 'COMMENT') return <MessageCircle size={11} strokeWidth={2} />;
    if (type === 'REACTION') return <Heart size={11} strokeWidth={2} />;
    return <UserPlus size={11} strokeWidth={2} />;
}

// ── Action type ───────────────────────────────────────────────────────
type NotificationAction = 'HIDE' | 'SHOW' | 'DELETE';

// ── Modal nhập password để HIDE ───────────────────────────────────────
interface PasswordModalProps {
    readonly onConfirm: (password: string) => void;
    readonly onCancel: () => void;
    readonly loading: boolean;
    readonly error: string;
}

function PasswordModal({ onConfirm, onCancel, loading, error }: PasswordModalProps) {
    const [pw, setPw] = useState('');
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3 className={styles.modalTitle}>Nhập mật khẩu thông báo</h3>
                <p className={styles.modalDesc}>Nhập mật khẩu 4 số để ẩn thông báo này</p>
                <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    className={styles.pinInput}
                    value={pw}
                    onChange={e => setPw(e.target.value.replaceAll(/\D/g, ''))}
                    autoFocus
                />
                {error && <p className={styles.modalError}>{error}</p>}
                <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
                        Hủy
                    </button>
                    <button
                        className={styles.confirmBtn}
                        onClick={() => onConfirm(pw)}
                        disabled={loading || pw.length !== 4}
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Modal setup password lần đầu (OTP → đặt password) ────────────────
interface SetupPasswordModalProps {
    readonly onClose: () => void;
    readonly onDone: () => void;
}

function SetupPasswordModal({ onClose, onDone }: SetupPasswordModalProps) {
    const [step, setStep] = useState<'sending' | 'otp' | 'password' | 'error'>('sending');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        notificationApi.setupNotificationPassword()
            .then(() => setStep('otp'))
            .catch((e: unknown) => {
                const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code;
                if (code === 'NOTIFICATION_PASSWORD_ALREADY_SET') {
                    onClose();
                } else {
                    setError('Không thể gửi OTP. Thử lại sau.');
                    setStep('error');
                }
            });
    }, [onClose]);

    const handleVerify = () => {
        if (otp.length !== 6) { setError('OTP gồm 6 chữ số'); return; }
        setError('');
        setStep('password');
    };

    const handleSetPassword = async () => {
        if (newPassword.length !== 4) { setError('Mật khẩu phải đúng 4 chữ số'); return; }
        setLoading(true);
        try {
            await notificationApi.verifyOtpAndSetPassword({ otp, newPassword });
            onDone();
        } catch {
            setError('OTP không đúng hoặc đã hết hạn');
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                {step === 'sending' && (
                    <>
                        <h3 className={styles.modalTitle}>Đang gửi OTP...</h3>
                        <div className={styles.spinnerCenter} />
                    </>
                )}
                {step === 'error' && (
                    <>
                        <h3 className={styles.modalTitle}>Có lỗi xảy ra</h3>
                        <p className={styles.modalDesc}>{error}</p>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={onClose}>Đóng</button>
                        </div>
                    </>
                )}
                {step === 'otp' && (
                    <>
                        <h3 className={styles.modalTitle}>Xác nhận email</h3>
                        <p className={styles.modalDesc}>Nhập mã OTP 6 số đã gửi về email của bạn</p>
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="Nhập OTP"
                            className={styles.pinInput}
                            value={otp}
                            onChange={e => setOtp(e.target.value.replaceAll(/\D/g, ''))}
                            autoFocus
                        />
                        {error && <p className={styles.modalError}>{error}</p>}
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={onClose}>Hủy</button>
                            <button
                                className={styles.confirmBtn}
                                onClick={handleVerify}
                                disabled={otp.length !== 6}
                            >
                                Tiếp tục
                            </button>
                        </div>
                    </>
                )}
                {step === 'password' && (
                    <>
                        <h3 className={styles.modalTitle}>Tạo mật khẩu</h3>
                        <p className={styles.modalDesc}>Đặt mật khẩu 4 số để bảo vệ thông báo ẩn</p>
                        <input
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            className={styles.pinInput}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value.replaceAll(/\D/g, ''))}
                            autoFocus
                        />
                        {error && <p className={styles.modalError}>{error}</p>}
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                                Hủy
                            </button>
                            <button
                                className={styles.confirmBtn}
                                onClick={() => { void handleSetPassword(); }}
                                disabled={loading || newPassword.length !== 4}
                            >
                                {loading ? 'Đang lưu...' : 'Lưu mật khẩu'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Context Menu Portal ───────────────────────────────────────────────
interface ContextMenuPortalProps {
    readonly notification: NotificationResponse;
    readonly anchorRect: DOMRect;
    readonly onHide: () => void;
    readonly onShow: () => void;
    readonly onDelete: () => void;
    readonly onClose: () => void;
}

function ContextMenuPortal({
    notification,
    anchorRect,
    onHide,
    onShow,
    onDelete,
    onClose,
}: ContextMenuPortalProps) {
    const ref = useRef<HTMLDivElement>(null);
    const MENU_HEIGHT = 90;
    const MENU_WIDTH = 200;

    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const openUp = spaceBelow < MENU_HEIGHT + 8;
    const top = openUp ? anchorRect.top - MENU_HEIGHT - 4 : anchorRect.bottom + 4;
    const left = Math.max(8, anchorRect.right - MENU_WIDTH);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const id = setTimeout(() => { document.addEventListener('mousedown', h); }, 0);
        return () => {
            clearTimeout(id);
            document.removeEventListener('mousedown', h);
        };
    }, [onClose]);

    return (
        <div
            ref={ref}
            className={styles.contextMenuFixed}
            style={{ top, left, minWidth: MENU_WIDTH }}
        >
            {notification.isHidden ? (
                <button onClick={onShow}>
                    <Eye size={15} strokeWidth={1.8} />
                    Hiện thông báo
                </button>
            ) : (
                <button onClick={onHide}>
                    <EyeOff size={15} strokeWidth={1.8} />
                    Ẩn thông báo
                </button>
            )}
            <div className={styles.menuDivider} />
            <button onClick={onDelete} className={styles.deleteOption}>
                <Trash2 size={15} strokeWidth={1.8} />
                Xóa thông báo
            </button>
        </div>
    );
}

// ── Notification Item ─────────────────────────────────────────────────
interface NotificationItemProps {
    readonly notification: NotificationResponse;
    readonly onRead: (id: number) => void;
    readonly onMenuOpen: (menu: { notification: NotificationResponse; rect: DOMRect } | null) => void;
    readonly activeMenuId: number | null;
    // ↓ callback mới — chỉ dùng cho REPORT_REVIEWED
    readonly onOpenReportDetail: (notificationId: number) => void;
}

function NotificationItem({
    notification,
    onRead,
    onMenuOpen,
    activeMenuId,
    onOpenReportDetail,
}: NotificationItemProps) {
    const navigate = useNavigate();
    const [followed, setFollowed] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const moreBtnRef = useRef<HTMLButtonElement>(null);

    const isMenuOpen = activeMenuId === notification.id;

    const handleClick = () => {
        if (!notification.isRead) onRead(notification.id);

        // ── Report types — xử lý riêng, KHÔNG navigate profile ──────
        if (notification.type === 'REPORT_REVIEWED') {
            onOpenReportDetail(notification.id);
            return;
        }
        if (notification.type === 'REPORT_VIOLATION') {
            void navigate('/my-violations');
            return;
        }

        // ── Reaction & Comment → navigate to specific post in profile ───────────
        if ((notification.type === 'REACTION' || notification.type === 'COMMENT') && notification.referenceId) {
            void navigate(`/profile/me?postId=${notification.referenceId}`);
            return;
        }

        // ── Các loại thông thường → navigate profile ─────────────────
        void navigate(`/profile/${notification.actorId}`);
    };

    const handleFollow = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (followLoading || followed) return;
        setFollowLoading(true);
        try {
            await followApi.followUser(notification.actorId);
            setFollowed(true);
        } catch { /* ignore */ }
        finally { setFollowLoading(false); }
    };

    const handleMoreClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (isMenuOpen) { onMenuOpen(null); return; }
        const rect = moreBtnRef.current?.getBoundingClientRect();
        if (rect) onMenuOpen({ notification, rect });
    };

    const isReportType = notification.type === 'REPORT_REVIEWED'
        || notification.type === 'REPORT_VIOLATION';
    const showFollowBtn = !isReportType
        && (notification.type === 'FOLLOW_REQUEST' || notification.type === 'FOLLOW');
    const isFriend = notification.type === 'FOLLOW_BACK';
    const typeIconColor = getTypeIconColor(notification.type);

    return (
        <div className={`${styles.item} ${isMenuOpen ? styles.itemActive : ''}`}>
            <button
                type="button"
                className={styles.itemMain}
                onClick={handleClick}
            >
                <div className={styles.avatarWrap}>
                    {/* Report type dùng icon hệ thống thay vì avatar actor */}
                    {isReportType ? (
                        <span className={styles.systemAvatar}>
                            {notification.type === 'REPORT_REVIEWED'
                                ? <ShieldCheck size={18} strokeWidth={1.8} />
                                : <ShieldAlert size={18} strokeWidth={1.8} />
                            }
                        </span>
                    ) : notification.actorAvatar ? (
                        <img
                            src={notification.actorAvatar}
                            alt={notification.actorName}
                            className={styles.avatar}
                        />
                    ) : (
                        <span className={styles.avatarFallback}>
                            {notification.actorName?.charAt(0).toUpperCase() ?? '?'}
                        </span>
                    )}
                    <span className={`${styles.typeIcon} ${typeIconColor}`}>
                        <NotificationTypeIcon type={notification.type} />
                    </span>
                </div>

                <div className={styles.body}>
                    <p className={`${styles.content} ${notification.isRead ? styles.contentRead : ''}`}>
                        {notification.content}
                    </p>
                    <span className={styles.time}>{timeAgo(notification.createdAt)}</span>
                </div>
            </button>

            <div className={styles.action}>
                {showFollowBtn && !isFriend && (
                    <button
                        type="button"
                        className={`${styles.followBtn} ${followed ? styles.followedBtn : ''}`}
                        onClick={e => { void handleFollow(e); }}
                        disabled={followLoading || followed}
                    >
                        {followed ? 'Đã theo dõi' : 'Theo dõi'}
                    </button>
                )}
                {isFriend && <span className={styles.friendBadge}>Bạn bè</span>}
                {!notification.isRead && <span className={styles.dot} />}

                <button
                    ref={moreBtnRef}
                    type="button"
                    className={`${styles.moreBtn} ${isMenuOpen ? styles.moreBtnActive : ''}`}
                    onClick={handleMoreClick}
                    aria-label="Tùy chọn"
                >
                    <MoreVertical size={16} strokeWidth={1.8} />
                </button>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────
export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const [activeMenu, setActiveMenu] = useState<{
        notification: NotificationResponse;
        rect: DOMRect;
    } | null>(null);

    const [passwordModal, setPasswordModal] = useState<{
        notification: NotificationResponse;
        action: 'HIDE' | 'SHOW';
    } | null>(null);
    const [setupModal, setSetupModal] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const pendingAction = useRef<{ notification: NotificationResponse; action: 'HIDE' } | null>(null);

    // ── State mới: notificationId của REPORT_REVIEWED đang xem ───────
    const [reportDetailId, setReportDetailId] = useState<number | null>(null);

    useEffect(() => {
        const fetchCount = () => {
            notificationApi.getUnreadCount()
                .then(res => setUnread(res.data.data))
                .catch(() => {});
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);

        const handleNewNotification = () => {
            fetchCount();
            if (open) {
                void fetchNotifications();
            }
        };
        window.addEventListener(WS_EVENTS.WINDOW_NEW_NOTIFICATION, handleNewNotification);

        return () => {
            clearInterval(interval);
            window.removeEventListener(WS_EVENTS.WINDOW_NEW_NOTIFICATION, handleNewNotification);
        };
    }, [open]); // Added 'open' dependency to trigger refetch if panel is open

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await notificationApi.getNotifications(0, 20);
            setNotifications(res.data.data.content);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    const handleOpen = () => {
        setOpen(prev => {
            if (prev) {
                setActiveMenu(null);
            } else {
                void fetchNotifications();
            }
            return !prev;
        });
    };

    const handleRead = async (id: number) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnread(prev => Math.max(0, prev - 1));
        } catch { /* ignore */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnread(0);
        } catch { /* ignore */ }
    };

    const doAction = useCallback(async (
        notification: NotificationResponse,
        action: 'HIDE' | 'SHOW' | 'DELETE',
        password?: string
    ) => {
        try {
            await notificationApi.handleAction({ action, id: notification.id, passWord: password });
            if (action === 'DELETE') {
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
            } else {
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, isHidden: action === 'HIDE' } : n)
                );
            }
        } catch (e: unknown) {
            const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code;
            if (code === 'NOTIFICATION_PASSWORD_NOT_SET') {
                pendingAction.current = { notification, action: 'HIDE' };
                setPasswordModal(null);
                setSetupModal(true);
            } else {
                throw e;
            }
        }
    }, []);

    const handleAction = useCallback((
        notification: NotificationResponse,
        action: NotificationAction
    ) => {
        setActiveMenu(null);
        if (action === 'DELETE') { void doAction(notification, 'DELETE'); return; }
        if (action === 'SHOW')   { void doAction(notification, 'SHOW');   return; }
        setPasswordError('');
        setPasswordModal({ notification, action: 'HIDE' });
    }, [doAction]);

    const handlePasswordConfirm = async (password: string) => {
        if (!passwordModal) return;
        setPasswordLoading(true);
        setPasswordError('');
        try {
            await doAction(passwordModal.notification, passwordModal.action, password);
            setPasswordModal(null);
        } catch (e: unknown) {
            const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code;
            if (code === 'NOTIFICATION_PASSWORD_WRONG') {
                setPasswordError('Mật khẩu không đúng, thử lại');
            } else {
                setPasswordError('Có lỗi xảy ra, thử lại sau');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSetupDone = () => {
        setSetupModal(false);
        if (pendingAction.current) {
            setPasswordError('');
            setPasswordModal({ notification: pendingAction.current.notification, action: 'HIDE' });
            pendingAction.current = null;
        }
    };

    // Mở modal report detail, đồng thời đóng panel và đánh dấu đã đọc
    const handleOpenReportDetail = useCallback((notificationId: number) => {
        const n = notifications.find(x => x.id === notificationId);
        if (n && !n.isRead) void handleRead(notificationId);
        setOpen(false);
        setActiveMenu(null);
        setReportDetailId(notificationId);
    }, [notifications]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <div className={styles.wrap} ref={panelRef}>
                <button
                    type="button"
                    className={styles.bellBtn}
                    onClick={handleOpen}
                    aria-label="Thông báo"
                >
                    <Bell size={20} strokeWidth={1.8} />
                    {unread > 0 && (
                        <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>
                    )}
                </button>

                {open && (
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <span className={styles.panelTitle}>Thông báo</span>
                            {unread > 0 && (
                                <button
                                    type="button"
                                    className={styles.markAllBtn}
                                    onClick={() => { void handleMarkAllRead(); }}
                                >
                                    Đánh dấu đã đọc
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
                                    <Bell size={28} strokeWidth={1.4} color="#9CA3AF" />
                                    <p>Chưa có thông báo nào</p>
                                </div>
                            )}
                            {!loading && notifications.map(n => (
                                <NotificationItem
                                    key={n.id}
                                    notification={n}
                                    onRead={id => { void handleRead(id); }}
                                    onMenuOpen={menu => setActiveMenu(menu)}
                                    activeMenuId={activeMenu?.notification.id ?? null}
                                    onOpenReportDetail={handleOpenReportDetail}
                                />
                            ))}
                        </div>

                        {activeMenu && (
                            <ContextMenuPortal
                                notification={activeMenu.notification}
                                anchorRect={activeMenu.rect}
                                onHide={() => handleAction(activeMenu.notification, 'HIDE')}
                                onShow={() => handleAction(activeMenu.notification, 'SHOW')}
                                onDelete={() => handleAction(activeMenu.notification, 'DELETE')}
                                onClose={() => setActiveMenu(null)}
                            />
                        )}
                    </div>
                )}

                {passwordModal && (
                    <PasswordModal
                        onConfirm={pw => { void handlePasswordConfirm(pw); }}
                        onCancel={() => setPasswordModal(null)}
                        loading={passwordLoading}
                        error={passwordError}
                    />
                )}

                {setupModal && (
                    <SetupPasswordModal
                        onClose={() => setSetupModal(false)}
                        onDone={handleSetupDone}
                    />
                )}
            </div>

            {/* ReportDetailModal render ngoài wrap để không bị overflow:hidden clip */}
            {reportDetailId !== null && (
                <ReportDetailModal
                    notificationId={reportDetailId}
                    onClose={() => setReportDetailId(null)}
                />
            )}
        </>
    );
}