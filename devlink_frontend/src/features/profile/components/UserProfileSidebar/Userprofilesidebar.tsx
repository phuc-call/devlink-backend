import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfileResponse } from '../../../../types/profile.types';
import { followApi } from '../../../../api/user-service/followApi';
import type { FollowActionResult } from '../../../../api/user-service/followApi';
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
}

export default function UserProfileSidebar({ profile }: Props) {
    const navigate = useNavigate();
    const [followStatus, setFollowStatus] = useState<FollowActionResult | null>(null);
    const [loadingFollow, setLoadingFollow] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    const initials = profile?.fullName
        ? profile.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
        : '?';

    // GET /{userId}/follow → trả về NOT_FOLLOWING | FOLLOWING | FRIEND
    useEffect(() => {
        if (!profile?.userId) return;
        setLoadingFollow(true);
        followApi.getFollowStatus(profile.userId)
            .then(res => setFollowStatus(res.data.data))
            .catch(() => setFollowStatus('NOT_FOLLOWING'))
            .finally(() => setLoadingFollow(false));
    }, [profile?.userId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // NOT_FOLLOWING → POST /{userId}/follow
    const handleFollow = async () => {
        if (!profile?.userId) return;
        setActionLoading(true);
        try {
            await followApi.followUser(profile.userId);
            setFollowStatus('FOLLOWING');
            showToast('Đã gửi yêu cầu theo dõi!', 'success');
        } catch {
            showToast('Có lỗi xảy ra, thử lại!', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // FOLLOWING → Huỷ yêu cầu: DELETE /{userId}/follow
    const handleCancelFollow = async () => {
        if (!profile?.userId) return;
        setActionLoading(true);
        try {
            await followApi.unFollowUser(profile.userId);
            setFollowStatus('NOT_FOLLOWING');
            showToast('Đã huỷ yêu cầu theo dõi!', 'success');
        } catch {
            showToast('Có lỗi xảy ra, thử lại!', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // FRIEND → Unfollow: DELETE /{userId}/follow
    const handleUnfollow = async () => {
        if (!profile?.userId) return;
        setActionLoading(true);
        try {
            await followApi.unFollowUser(profile.userId);
            setFollowStatus('NOT_FOLLOWING');
            showToast('Đã huỷ theo dõi!', 'success');
        } catch {
            showToast('Có lỗi xảy ra, thử lại!', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Settings → Block: POST /me/block/{userId}
    const handleBlock = async () => {
        if (!profile?.userId) return;
        setShowSettings(false);
        setActionLoading(true);
        try {
            await followApi.blockUser(profile.userId);
            showToast(`Đã chặn ${profile.fullName}`, 'success');
        } catch {
            showToast('Có lỗi xảy ra, thử lại!', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Settings → Report: TODO — chờ backend tạo endpoint
    const handleReport = async () => {
        // Chưa có API, tạm thời chỉ đóng modal
        setShowReportModal(false);
        setReportReason('');
        showToast('Chức năng tố cáo đang được phát triển!', 'error');
    };

    const renderActionButtons = () => {
        if (loadingFollow) {
            return <div className={styles.btnSkeleton} />;
        }

        // NOT_FOLLOWING → nút Theo dõi full width
        if (followStatus === 'NOT_FOLLOWING') {
            return (
                <button className={styles.btnFollow} onClick={handleFollow} disabled={actionLoading}>
                    {actionLoading ? <span className={styles.spinner} /> : (
                        <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="8.5" cy="7" r="4"/>
                                <line x1="20" y1="8" x2="20" y2="14"/>
                                <line x1="23" y1="11" x2="17" y2="11"/>
                            </svg>
                            Theo dõi
                        </>
                    )}
                </button>
            );
        }

        // FOLLOWING → "Huỷ yêu cầu" + "Nhắn tin" song song
        if (followStatus === 'FOLLOWING') {
            return (
                <div className={styles.btnRow}>
                    <button className={styles.btnCancel} onClick={handleCancelFollow} disabled={actionLoading}>
                        {actionLoading ? <span className={styles.spinnerDark} /> : (
                            <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="8.5" cy="7" r="4"/>
                                    <line x1="23" y1="11" x2="17" y2="11"/>
                                </svg>
                                Huỷ yêu cầu
                            </>
                        )}
                    </button>
                    <button className={styles.btnMessage} onClick={() => navigate('/chat')} disabled={actionLoading}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        Nhắn tin
                    </button>
                </div>
            );
        }

        // FRIEND → "Bạn bè" (click để unfollow) + "Nhắn tin" song song
        if (followStatus === 'FRIEND') {
            return (
                <div className={styles.btnRow}>
                    <button
                        className={styles.btnFriend}
                        onClick={handleUnfollow}
                        disabled={actionLoading}
                        title="Bấm để huỷ theo dõi"
                    >
                        {actionLoading ? <span className={styles.spinnerDark} /> : (
                            <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                                Bạn bè
                            </>
                        )}
                    </button>
                    <button className={styles.btnMessage} onClick={() => navigate('/chat')} disabled={actionLoading}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        Nhắn tin
                    </button>
                </div>
            );
        }

        return null;
    };

    return (
        <div className={styles.wrap}>
            {toast && (
                <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
                </div>
            )}

            <div className={styles.avatarBlock}>
                {/* Settings top-right */}
                <div className={styles.topBar}>
                    <div className={styles.settingsWrap} ref={settingsRef}>
                        <button
                            className={styles.settingsBtn}
                            onClick={() => setShowSettings(p => !p)}
                            title="Tùy chọn"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="19" cy="12" r="1"/>
                                <circle cx="5" cy="12" r="1"/>
                            </svg>
                        </button>

                        {showSettings && (
                            <div className={styles.dropdown}>
                                <button
                                    className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                                    onClick={handleBlock}
                                    disabled={actionLoading}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                    </svg>
                                    Chặn người dùng
                                </button>
                                <button
                                    className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                                    onClick={() => { setShowSettings(false); setShowReportModal(true); }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                                        <line x1="4" y1="22" x2="4" y2="15"/>
                                    </svg>
                                    Tố cáo
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Avatar + info ngang hàng */}
                <div className={styles.profileRow}>
                    <div className={styles.avatarWrap}>
                        {profile?.avatarUrl
                            ? <img src={profile.avatarUrl} alt="avatar" className={styles.avatarImg} />
                            : <span className={styles.avatarInitials}>{initials}</span>
                        }
                    </div>
                    <div className={styles.profileInfo}>
                        <h1 className={styles.name}>{profile?.fullName || 'Người dùng'}</h1>
                        {profile?.bio && <p className={styles.bio}>{profile.bio}</p>}
                        <div className={styles.statsRow}>
                            <span className={styles.statItem}>
                                <strong>{profile?.followerCount ?? 0}</strong>
                                <span>followers</span>
                            </span>
                            <span className={styles.statDot}>·</span>
                            <span className={styles.statItem}>
                                <strong>{profile?.followingCount ?? 0}</strong>
                                <span>following</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className={styles.actionRow}>
                    {renderActionButtons()}
                </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.infoList}>
                {profile?.school && (
                    <div className={styles.infoRow}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                        </svg>
                        <span>{profile.school}</span>
                    </div>
                )}
                {profile?.major && (
                    <div className={styles.infoRow}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <rect x="2" y="3" width="20" height="14" rx="2"/>
                            <path d="M8 21h8M12 17v4"/>
                        </svg>
                        <span>{profile.major}</span>
                    </div>
                )}
                {profile?.city && (
                    <div className={styles.infoRow}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
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
                        <p className={styles.langTitle}>Ngôn ngữ yêu thích</p>
                        <div className={styles.langList}>
                            {profile.favoriteLanguage.map(lang => (
                                <div key={lang} className={styles.langRow}>
                                    <span
                                        className={styles.langDot}
                                        style={{ background: LANG_COLORS[lang] ?? '#9CA3AF' }}
                                    />
                                    <span className={styles.langName}>{LANG_LABELS[lang] ?? lang}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {showReportModal && (
                <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Tố cáo người dùng</h3>
                            <button className={styles.modalClose} onClick={() => setShowReportModal(false)}>✕</button>
                        </div>
                        <p className={styles.modalSub}>
                            Hãy cho chúng tôi biết lý do bạn tố cáo <strong>{profile?.fullName}</strong>
                        </p>
                        <div className={styles.reportReasons}>
                            {[
                                'Nội dung không phù hợp',
                                'Spam hoặc quảng cáo',
                                'Giả mạo danh tính',
                                'Quấy rối hoặc bắt nạt',
                                'Ngôn từ thù địch',
                                'Lý do khác',
                            ].map(reason => (
                                <button
                                    key={reason}
                                    className={`${styles.reasonChip} ${reportReason === reason ? styles.reasonActive : ''}`}
                                    onClick={() => setReportReason(reason)}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.modalBtnCancel} onClick={() => setShowReportModal(false)}>
                                Huỷ
                            </button>
                            <button
                                className={styles.modalBtnSubmit}
                                onClick={handleReport}
                                disabled={!reportReason || actionLoading}
                            >
                                {actionLoading ? <span className={styles.spinner} /> : 'Gửi tố cáo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}