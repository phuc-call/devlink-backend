import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../../../context/Toastcontext.tsx';
import { useNavigate } from 'react-router-dom';
import type { UserProfileResponse } from '../../../../types/profile.types';
import { followApi } from '../../../../api/user-service/followApi';
import type { FollowActionResult } from '../../../../api/user-service/followApi';
import { WS_EVENTS } from '../../../../constants/wsEvents';
import styles from './Userprofilesidebar.module.css';

const LANG_LABELS: Record<string, string> = {
    JAVASCRIPT: 'JavaScript', TYPESCRIPT: 'TypeScript', PYTHON: 'Python',
    JAVA: 'Java', GO: 'Go', RUST: 'Rust', CPP: 'C++', CSHARP: 'C#',
    KOTLIN: 'Kotlin', SWIFT: 'Swift', PHP: 'PHP', RUBY: 'Ruby',
};
const LANG_COLORS: Record<string, string> = {
    JAVASCRIPT: '#F7DF1E', TYPESCRIPT: '#3178C6', PYTHON: '#3572A5',
    JAVA: '#B07219', GO: '#00ADD8', RUST: '#DEA584', CPP: '#F34B7D',
    CSHARP: '#178600', KOTLIN: '#A97BFF', SWIFT: '#F05138',
    PHP: '#4F5D95', RUBY: '#701516',
};

interface Props { 
    profile: UserProfileResponse | null;
    onAvatarClick?: () => void;
}

export default function UserProfileSidebar({ profile, onAvatarClick }: Props) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [followStatus, setFollowStatus] = useState<FollowActionResult | null>(null);
    const [loadingFollow, setLoadingFollow] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isBlocked, setIsBlocked] = useState(false);
    const [loadingBlock, setLoadingBlock] = useState(true);
    const settingsRef = useRef<HTMLDivElement>(null);

    const initials = profile?.fullName
        ? profile.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
        : '?';

    // ── Derived state ────────────────────────────────────────────
    // Use the `limited` field returned by backend — no guessing
    const isLimited = profile?.limited === true;
    const isPrivate = profile?.profileVisibility === 'PRIVATE';

    // ── Side-effects ─────────────────────────────────────────────
    useEffect(() => {
        const fetchBlockStatus = () => {
            if (!profile?.userId) return;
            followApi.getBlockStatus(profile.userId)
                .then(res => { setIsBlocked(res.data.data.blocked); setLoadingBlock(false); })
                .catch(() => { setIsBlocked(false); setLoadingBlock(false); });
        };
        fetchBlockStatus();

        const handleBlockUpdated = () => {
            fetchBlockStatus();
        };
        window.addEventListener(WS_EVENTS.WINDOW_BLOCK_UPDATED, handleBlockUpdated);

        return () => window.removeEventListener(WS_EVENTS.WINDOW_BLOCK_UPDATED, handleBlockUpdated);
    }, [profile?.userId]);

    useEffect(() => {
        if (!profile?.userId) return;
        followApi.getFollowStatus(profile.userId)
            .then(res => { setFollowStatus(res.data.data); setLoadingFollow(false); })
            .catch(() => { setFollowStatus('NOT_FOLLOWING'); setLoadingFollow(false); });
    }, [profile?.userId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node))
                setShowSettings(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Handlers ─────────────────────────────────────────────────
    const handleFollow = async () => {
        if (!profile?.userId) return;
        setActionLoading(true);
        try {
            await followApi.followUser(profile.userId);
            setFollowStatus('FOLLOWING');
            showToast('Đã gửi yêu cầu theo dõi!', 'success');
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Có lỗi xảy ra!', 'error');
        } finally { setActionLoading(false); }
    };

    const handleUnfollow = async (msg = 'Đã huỷ theo dõi!') => {
        if (!profile?.userId) return;
        setActionLoading(true);
        try {
            await followApi.unFollowUser(profile.userId);
            setFollowStatus('NOT_FOLLOWING');
            showToast(msg, 'success');
        } catch { showToast('Có lỗi xảy ra!', 'error'); }
        finally { setActionLoading(false); }
    };

    const handleBlock = async () => {
        if (!profile?.userId) return;
        setShowSettings(false); setActionLoading(true);
        try {
            const res = await followApi.blockUser(profile.userId);
            const { blocked, message } = res.data.data;
            setIsBlocked(blocked);
            showToast(message ?? '', 'success');
        } catch { showToast('Có lỗi xảy ra!', 'error'); }
        finally { setActionLoading(false); }
    };

    const handleReport = async () => {
        setShowReportModal(false); setReportReason('');
        showToast('Chức năng tố cáo đang được phát triển!', 'error');
    };

    // ── Render action buttons ─────────────────────────────────────
    const renderActions = () => {
        if (loadingFollow) return <div className={styles.btnSkeleton} />;

        if (followStatus === 'NOT_FOLLOWING') return (
            <button type="button" className={styles.btnPrimary} onClick={handleFollow} disabled={actionLoading}>
                {actionLoading ? <span className={styles.spinnerWhite} /> : (
                    <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        Theo dõi
                    </>
                )}
            </button>
        );

        if (followStatus === 'FOLLOWING') return (
            <div className={styles.btnRow}>
                <button type="button" className={styles.btnSecondary} onClick={() => handleUnfollow('Đã huỷ yêu cầu!')} disabled={actionLoading}>
                    {actionLoading ? <span className={styles.spinnerDark} /> : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                            Huỷ yêu cầu
                        </>
                    )}
                </button>
                <button type="button" className={styles.btnOutline} onClick={() => navigate('/chat')} disabled={actionLoading}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Nhắn tin
                </button>
            </div>
        );

        if (followStatus === 'FRIEND') return (
            <div className={styles.btnRow}>
                <button type="button" className={styles.btnFriend} onClick={() => handleUnfollow()} disabled={actionLoading} title="Bấm để huỷ theo dõi">
                    {actionLoading ? <span className={styles.spinnerDark} /> : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            Bạn bè
                        </>
                    )}
                </button>
                <button type="button" className={styles.btnOutline} onClick={() => navigate('/chat')} disabled={actionLoading}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Nhắn tin
                </button>
            </div>
        );

        return null;
    };

    const blockLabel = loadingBlock ? 'Đang tải...' : isBlocked ? 'Bỏ chặn người dùng' : 'Chặn người dùng';

    return (
        <div className={styles.card}>

            {/* ── Header: avatar + name + settings ── */}
            <div className={styles.header}>
                {/* Settings button — top right */}
                <div className={styles.settingsWrap} ref={settingsRef}>
                    <button type="button" className={styles.settingsBtn}
                        onClick={() => setShowSettings(p => !p)} title="Tùy chọn" aria-label="Tùy chọn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>
                    {showSettings && (
                        <div className={styles.dropdown}>
                            <button type="button" className={`${styles.ddItem} ${styles.ddDanger}`}
                                onClick={handleBlock} disabled={actionLoading || loadingBlock}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                {blockLabel}
                            </button>
                            <button type="button" className={`${styles.ddItem} ${styles.ddDanger}`}
                                onClick={() => { setShowSettings(false); setShowReportModal(true); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                                Tố cáo
                            </button>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <div 
                    className={styles.avatarWrap} 
                    onClick={onAvatarClick}
                    style={onAvatarClick ? { cursor: 'pointer' } : {}}
                >
                    {profile?.avatarUrl
                        ? <img src={profile.avatarUrl} alt={profile.fullName || 'avatar'} className={styles.avatar} />
                        : <span className={styles.avatarInitials}>{initials}</span>
                    }
                </div>

                {/* Name + bio + stats */}
                <h1 className={styles.name}>{profile?.fullName || 'Người dùng'}</h1>
                {!isLimited && profile?.bio && <p className={styles.bio}>{profile.bio}</p>}

                {!isLimited && (
                    <div className={styles.statsRow}>
                        <span className={styles.stat}><strong>{profile?.followerCount ?? 0}</strong> followers</span>
                        <span className={styles.statDot}>·</span>
                        <span className={styles.stat}><strong>{profile?.followingCount ?? 0}</strong> following</span>
                    </div>
                )}

                {/* Action buttons */}
                <div className={styles.actions}>
                    {renderActions()}
                </div>
            </div>

            {/* ── Shield banner (khi profile bị giới hạn) ── */}
            {isLimited && (
                <div className={`${styles.shield} ${isPrivate ? styles.shieldRed : styles.shieldGreen}`}>
                    {isPrivate ? (
                        /* Khiên đỏ — PRIVATE */
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <circle cx="12" cy="16" r="1" fill="#DC2626"/>
                        </svg>
                    ) : (
                        /* Khiên xanh — PROTECTED */
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <polyline points="9 12 11 14 15 10"/>
                        </svg>
                    )}
                    <div>
                        <p className={`${styles.shieldTitle} ${isPrivate ? styles.shieldTitleRed : styles.shieldTitleGreen}`}>
                            {isPrivate ? 'Hồ sơ riêng tư' : 'Hồ sơ được bảo vệ'}
                        </p>
                        <p className={styles.shieldSub}>
                            {isPrivate
                                ? 'Người dùng này đã ẩn hồ sơ với tất cả mọi người'
                                : 'Chỉ bạn bè mới có thể xem nội dung'}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Info (chỉ hiện khi không bị giới hạn) ── */}
            {!isLimited && (
                <>
                    <div className={styles.divider} />
                    <div className={styles.infoList}>
                        {profile?.school && (
                            <div className={styles.infoRow}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                                <span>{profile.school}</span>
                            </div>
                        )}
                        {profile?.major && (
                            <div className={styles.infoRow}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                                <span>{profile.major}</span>
                            </div>
                        )}
                        {profile?.city && (
                            <div className={styles.infoRow}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span>{profile.city}{profile.country ? `, ${profile.country}` : ''}</span>
                            </div>
                        )}
                        {!profile?.school && !profile?.major && !profile?.city && (
                            <p className={styles.noInfo}>Chưa có thông tin</p>
                        )}
                    </div>

                    {profile?.favoriteLanguage && profile.favoriteLanguage.length > 0 && (
                        <>
                            <div className={styles.divider} />
                            <div className={styles.langSection}>
                                <p className={styles.langTitle}>NGÔN NGỮ YÊU THÍCH</p>
                                <div className={styles.langList}>
                                    {profile.favoriteLanguage.map(lang => (
                                        <div key={lang} className={styles.langRow}>
                                            <span className={styles.langDot} style={{ background: LANG_COLORS[lang] ?? '#9CA3AF' }} />
                                            <span className={styles.langName}>{LANG_LABELS[lang] ?? lang}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── Report modal ── */}
            {showReportModal && (
                <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)} role="dialog" aria-modal="true">
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Tố cáo người dùng</h3>
                            <button type="button" className={styles.modalClose} onClick={() => setShowReportModal(false)}>✕</button>
                        </div>
                        <p className={styles.modalSub}>Lý do bạn tố cáo <strong>{profile?.fullName}</strong></p>
                        <div className={styles.reportReasons}>
                            {['Nội dung không phù hợp','Spam hoặc quảng cáo','Giả mạo danh tính','Quấy rối hoặc bắt nạt','Ngôn từ thù địch','Lý do khác'].map(r => (
                                <button key={r} type="button"
                                    className={`${styles.chip} ${reportReason === r ? styles.chipActive : ''}`}
                                    onClick={() => setReportReason(r)}>{r}</button>
                            ))}
                        </div>
                        <div className={styles.modalActions}>
                            <button type="button" className={styles.modalBtnCancel} onClick={() => setShowReportModal(false)}>Huỷ</button>
                            <button type="button" className={styles.modalBtnSubmit} onClick={handleReport} disabled={!reportReason || actionLoading}>
                                {actionLoading ? <span className={styles.spinnerWhite} /> : 'Gửi tố cáo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}