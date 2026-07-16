// src/features/notification/components/HiddenNotificationSection.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    EyeOff, ChevronDown, ChevronUp, Lock, ShieldCheck,
    AlertCircle, KeyRound, Eye, Trash2, MoreVertical,
    Users, UserPlus, Cake,
} from 'lucide-react';
import { notificationApi } from '../../../api/user-service/notificationApi';
import type { NotificationResponse } from '../../../types/notification.types';
import styles from './HiddenNotificationSection.module.css';

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

function parseErrorCode(e: unknown): string {
    const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code;
    if (code === 'NOTIFICATION_PASSWORD_NOT_SET') return 'Bạn chưa đặt mật khẩu thông báo';
    if (code === 'NOTIFICATION_PASSWORD_WRONG') return 'Mật khẩu không đúng, thử lại';
    return 'Có lỗi xảy ra, thử lại sau';
}

// ── PIN Input ─────────────────────────────────────────────────────────
export function PinInput({ error, onChange }: { error: string; onChange: (v: string) => void }) {
    const [digits, setDigits] = useState(['', '', '', '']);
    const refs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    const handleDigit = (i: number, val: string) => {
        const d = val.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[i] = d;
        setDigits(next);
        onChange(next.join(''));
        if (d && i < 3) refs[i + 1].current?.focus();
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus();
    };

    return (
        <div className={styles.pinRow}>
            {refs.map((ref, i) => (
                <input
                    key={i} ref={ref}
                    type="password" inputMode="numeric" maxLength={1}
                    className={`${styles.pinBox} ${error ? styles.pinBoxError : ''}`}
                    value={digits[i]}
                    onChange={e => handleDigit(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    autoFocus={i === 0}
                />
            ))}
        </div>
    );
}

// ── Step: Nhập mật khẩu để xem ───────────────────────────────────────
interface EnterPasswordStepProps {
    readonly onSuccess: () => void;
    readonly onNoPassword: () => void;
}

function EnterPasswordStep({ onSuccess, onNoPassword }: EnterPasswordStepProps) {
    const [pw, setPw] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        try {
            await notificationApi.checkPassword(pw);
            onSuccess();
        } catch (e: unknown) {
            setError(parseErrorCode(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.stepBox}>
            <div className={styles.stepIcon}><Lock size={20} strokeWidth={1.8} /></div>
            <p className={styles.stepTitle}>Nhập mật khẩu để xem</p>
            <p className={styles.stepDesc}>Mật khẩu 4 số bảo vệ thông báo ẩn của bạn</p>
            <PinInput error={error} onChange={setPw} />
            {error && (
                <div className={styles.errorRow}>
                    <AlertCircle size={13} strokeWidth={2} />
                    <span>{error}</span>
                </div>
            )}
            <div className={styles.stepActions}>
                <button
                    className={styles.confirmBtn}
                    onClick={() => { void handleConfirm(); }}
                    disabled={loading || pw.length !== 4}
                >
                    <ShieldCheck size={15} strokeWidth={2} />
                    {loading ? 'Đang xác nhận...' : 'Mở khóa'}
                </button>
                <button className={styles.linkBtn} onClick={onNoPassword}>
                    Quên mật khẩu?
                </button>
            </div>
        </div>
    );
}

// ── Step: Setup OTP → đặt mật khẩu lần đầu ──────────────────────────
interface SetupPasswordStepProps {
    readonly onDone: () => void;
}

function SetupPasswordStep({ onDone }: SetupPasswordStepProps) {
    const [step, setStep] = useState<'sending' | 'otp' | 'newpw' | 'error'>('sending');
    const [otp, setOtp] = useState('');
    const [newPw, setNewPw] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        notificationApi.setupNotificationPassword()
            .then(() => setStep('otp'))
            .catch((e: unknown) => {
                const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code;
                // Đã có password → chuyển thẳng sang nhập password
                if (code === 'NOTIFICATION_PASSWORD_ALREADY_SET') {
                    onDone();
                } else {
                    setError('Không thể gửi OTP. Thử lại sau.');
                    setStep('error');
                }
            });
    }, [onDone]);

    const handleSetPassword = async () => {
        if (newPw.length !== 4) { setError('Mật khẩu phải đúng 4 chữ số'); return; }
        setLoading(true);
        setError('');
        try {
            await notificationApi.verifyOtpAndSetPassword({ otp, newPassword: newPw });
            onDone();
        } catch {
            setError('OTP không đúng hoặc đã hết hạn');
            setLoading(false);
        }
    };

    if (step === 'sending') return (
        <div className={styles.stepBox}>
            <div className={styles.stepIcon}><KeyRound size={20} strokeWidth={1.8} /></div>
            <p className={styles.stepTitle}>Đang gửi OTP...</p>
            <div className={styles.spinner} />
        </div>
    );

    if (step === 'error') return (
        <div className={styles.stepBox}>
            <div className={`${styles.stepIcon} ${styles.stepIconError}`}>
                <AlertCircle size={20} strokeWidth={1.8} />
            </div>
            <p className={styles.stepTitle}>Có lỗi xảy ra</p>
            <p className={styles.stepDesc}>{error}</p>
        </div>
    );

    if (step === 'otp') return (
        <div className={styles.stepBox}>
            <div className={styles.stepIcon}><KeyRound size={20} strokeWidth={1.8} /></div>
            <p className={styles.stepTitle}>Xác nhận email</p>
            <p className={styles.stepDesc}>Nhập mã OTP 6 số đã gửi về email của bạn</p>
            <input
                type="text" maxLength={6} placeholder="Nhập OTP"
                className={styles.otpInput}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
            />
            {error && <div className={styles.errorRow}><AlertCircle size={13} /><span>{error}</span></div>}
            <div className={styles.stepActions}>
                <button
                    className={styles.confirmBtn}
                    onClick={() => { setError(''); setStep('newpw'); }}
                    disabled={otp.length !== 6}
                >
                    <ShieldCheck size={15} /> Tiếp tục
                </button>
            </div>
        </div>
    );

    return (
        <div className={styles.stepBox}>
            <div className={styles.stepIcon}><Lock size={20} strokeWidth={1.8} /></div>
            <p className={styles.stepTitle}>Tạo mật khẩu thông báo</p>
            <p className={styles.stepDesc}>Đặt mật khẩu 4 số để bảo vệ thông báo ẩn</p>
            <PinInput error={error} onChange={setNewPw} />
            {error && <div className={styles.errorRow}><AlertCircle size={13} /><span>{error}</span></div>}
            <div className={styles.stepActions}>
                <button
                    className={styles.confirmBtn}
                    onClick={() => { void handleSetPassword(); }}
                    disabled={loading || newPw.length !== 4}
                >
                    <ShieldCheck size={15} />
                    {loading ? 'Đang lưu...' : 'Lưu mật khẩu'}
                </button>
            </div>
        </div>
    );
}

// ── Type Icon ─────────────────────────────────────────────────────────
function TypeIcon({ type }: { readonly type: string }) {
    if (type === 'BIRTHDAY') return <Cake size={11} strokeWidth={2} />;
    if (type === 'FOLLOW_BACK') return <Users size={11} strokeWidth={2} />;
    return <UserPlus size={11} strokeWidth={2} />;
}

function typeBadgeClass(type: string, s: Record<string, string>) {
    if (type === 'BIRTHDAY') return s.badgeBirthday;
    if (type === 'FOLLOW_BACK') return s.badgeFriend;
    return s.badgeFollow;
}

// ── Context Menu ──────────────────────────────────────────────────────
interface CtxMenuProps {
    readonly onShow: () => void;
    readonly onDelete: () => void;
    readonly onClose: () => void;
}

function CtxMenu({ onShow, onDelete, onClose }: CtxMenuProps) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const id = setTimeout(() => document.addEventListener('mousedown', h), 0);
        return () => { clearTimeout(id); document.removeEventListener('mousedown', h); };
    }, [onClose]);

    return (
        <div ref={ref} className={styles.ctxMenu}>
            <button onClick={onShow} className={styles.ctxItem}>
                <Eye size={14} strokeWidth={1.8} /> Hiện thông báo
            </button>
            <div className={styles.ctxDivider} />
            <button onClick={onDelete} className={`${styles.ctxItem} ${styles.ctxDanger}`}>
                <Trash2 size={14} strokeWidth={1.8} /> Xóa thông báo
            </button>
        </div>
    );
}

// ── Show Password Modal (cho SHOW action) ─────────────────────────────
interface ShowActionModalProps {
    readonly notification: NotificationResponse;
    readonly onDone: () => void;
    readonly onCancel: () => void;
}

function ShowActionModal({ notification, onDone, onCancel }: ShowActionModalProps) {
    const [pw, setPw] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        try {
            await notificationApi.handleAction({
                action: 'SHOW',
                id: notification.id,
                passWord: pw,
            });
            onDone();
        } catch (e: unknown) {
            setError(parseErrorCode(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.stepIcon}><Eye size={20} strokeWidth={1.8} /></div>
                <p className={styles.stepTitle}>Hiện thông báo</p>
                <p className={styles.stepDesc}>Nhập mật khẩu 4 số để hiện thông báo này</p>
                <PinInput error={error} onChange={setPw} />
                {error && <div className={styles.errorRow}><AlertCircle size={13} /><span>{error}</span></div>}
                <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>Hủy</button>
                    <button
                        className={styles.confirmBtn}
                        onClick={() => { void handleConfirm(); }}
                        disabled={loading || pw.length !== 4}
                    >
                        <ShieldCheck size={15} />
                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Hidden Notification Item ──────────────────────────────────────────
export interface HiddenItemProps {
    readonly n: NotificationResponse;
    readonly onRefresh: () => void;
}

export function HiddenNotificationItem({ n, onRefresh }: HiddenItemProps) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleClick = () => {
        if (n.type === 'REPORT_REVIEWED' || n.type === 'REPORT_VIOLATION') {
            return; // Can't easily handle these here without more complex prop passing, and they are usually not hidden anyway
        }

        if (n.type === 'REACTION' && n.referenceId) {
            void navigate(`/profile/me?postId=${n.referenceId}`);
            return;
        }

        void navigate(`/profile/${n.actorId}`);
    };

    const handleDelete = async () => {
        try {
            await notificationApi.handleAction({ action: 'DELETE', id: n.id });
            onRefresh();
        } catch { /* ignore */ }
    };

    return (
        <>
            <div className={styles.item}>
                <button type="button" className={styles.itemMain} onClick={handleClick} style={{ border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    <div className={styles.avatarWrap}>
                        {n.actorAvatar
                            ? <img src={n.actorAvatar} alt={n.actorName} className={styles.avatar} />
                            : <span className={styles.avatarFallback}>{n.actorName?.charAt(0).toUpperCase() ?? '?'}</span>
                        }
                        <span className={`${styles.typeBadge} ${typeBadgeClass(n.type, styles)}`}>
                            <TypeIcon type={n.type} />
                        </span>
                    </div>
                    <div className={styles.itemBody}>
                        <p className={`${styles.itemContent} ${styles.contentRead}`}>
                            <strong>{n.actorName}</strong> {n.content}
                        </p>
                        <div className={styles.itemMeta}>
                            <span className={styles.itemTime}>{timeAgo(n.createdAt)}</span>
                            <span className={styles.hiddenTag}>
                                <EyeOff size={10} strokeWidth={2} /> Đã ẩn
                            </span>
                        </div>
                    </div>
                </button>

                <div className={styles.itemActions}>
                    <div className={styles.moreWrap}>
                        <button
                            type="button"
                            className={`${styles.moreBtn} ${menuOpen ? styles.moreBtnActive : ''}`}
                            onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}
                            aria-label="Tùy chọn"
                        >
                            <MoreVertical size={15} strokeWidth={1.8} />
                        </button>
                        {menuOpen && (
                            <CtxMenu
                                onShow={() => { setMenuOpen(false); setShowModal(true); }}
                                onDelete={() => { setMenuOpen(false); void handleDelete(); }}
                                onClose={() => setMenuOpen(false)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <ShowActionModal
                    notification={n}
                    onDone={() => { setShowModal(false); onRefresh(); }}
                    onCancel={() => setShowModal(false)}
                />
            )}
        </>
    );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────
type InnerStep = 'enter-password' | 'setup-password' | 'unlocked';

export default function HiddenNotificationSection() {
    const [open, setOpen] = useState(false);
    const [hiddenCount, setHiddenCount] = useState(0);
    const [step, setStep] = useState<InnerStep>('enter-password');

    // Fetch count khi mount
    useEffect(() => {
        notificationApi.getUnreadCountHidden()
            .then(res => setHiddenCount(res.data.data))
            .catch(() => {});
    }, []);

    // Khi bấm mở — kiểm tra đã set password chưa
    const handleToggle = async () => {
        if (open) { setOpen(false); return; }
        setOpen(true);
        if (step === 'unlocked') return; // đã unlock rồi không hỏi lại
        try {
            const res = await notificationApi.hasNotificationPassword();
            setStep(res.data.data ? 'enter-password' : 'setup-password');
        } catch {
            setStep('enter-password');
        }
    };


    const navigate = useNavigate();

    const handleUnlocked = () => {
        sessionStorage.setItem('hidden_unlocked', 'true');
        navigate('/hidden');
    };

    return (
        <div className={styles.section}>
            {/* Header — bấm để xổ */}
            <button
                type="button"
                className={styles.sectionHeader}
                onClick={() => { void handleToggle(); }}
            >
                <div className={styles.sectionHeaderLeft}>
                    <div className={styles.sectionIconWrap}>
                        <EyeOff size={16} strokeWidth={2} />
                    </div>
                    <div>
                        <p className={styles.sectionTitle}>Khu vực bảo mật</p>
                        <p className={styles.sectionSub}>
                            {hiddenCount > 0 ? `${hiddenCount} thông báo ẩn` : 'Không có nội dung ẩn'}
                        </p>
                    </div>
                </div>
                <div className={styles.sectionHeaderRight}>
                    {hiddenCount > 0 && (
                        <span className={styles.countBadge}>{hiddenCount}</span>
                    )}
                    {open
                        ? <ChevronUp size={16} strokeWidth={2} color="#9CA3AF" />
                        : <ChevronDown size={16} strokeWidth={2} color="#9CA3AF" />
                    }
                </div>
            </button>

            {/* Body — xổ xuống */}
            {open && (
                <div className={styles.sectionBody}>
                    {step === 'setup-password' && (
                        <SetupPasswordStep onDone={() => setStep('enter-password')} />
                    )}

                    {step === 'enter-password' && (
                        <EnterPasswordStep
                            onSuccess={handleUnlocked}
                            onNoPassword={() => setStep('setup-password')}
                        />
                    )}

                    {step === 'unlocked' && (
                        <div className={styles.loadingWrap}>
                            <div className={styles.spinner} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}