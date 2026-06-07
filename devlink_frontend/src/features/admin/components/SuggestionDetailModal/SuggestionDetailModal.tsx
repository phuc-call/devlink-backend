import {useEffect, useState} from 'react';
import {
    X, CheckCircle, XCircle, User,
    FileText, Clock, Hash, Loader2,
} from 'lucide-react';
import {
    getSuggestionDetail,
    approveSuggestion,
    rejectSuggestion,
} from '../../../../api/post-service/suggestionApi';
import type {SuggestionDetailResponse} from '../../../../types/suggestion.types';
import {getUserInfoById} from '../../../../api/post-service/suggestionApi';
import RejectModal from '../RejectModal/RejectModal';
import styles from './SuggestionDetailModal.module.css';

interface Props {
    suggestionId: number;
    onClose: () => void;
    onActionDone: () => void;
}

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const TYPE_LABEL: Record<string, string> = {
    CONTENT_FIX: 'Sửa nội dung',
    ADD_EXPLANATION: 'Bổ sung giải thích',
    REPORT_ERROR: 'Báo lỗi',
    OTHER: 'Khác',
};

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    REVIEWING: 'Đang xem xét',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Đã từ chối',
    CANCELLED: 'Đã thu hồi',
};

const STATUS_CLASS: Record<string, string> = {
    PENDING: styles.statusPending,
    REVIEWING: styles.statusReviewing,
    APPROVED: styles.statusApproved,
    REJECTED: styles.statusRejected,
    CANCELLED: styles.statusCancelled,
};

export default function SuggestionDetailModal({suggestionId, onClose, onActionDone}: Props) {
    const [detail, setDetail] = useState<SuggestionDetailResponse | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [approving, setApproving] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getSuggestionDetail(suggestionId, true)
            .then(async data => {
                setDetail(data);
                const info = await await getUserInfoById(data.userId).catch(() => null);
                setUserName(info?.userName ?? `User #${data.userId}`);
                setAvatar(info?.avatar ?? null);
            })
            .catch(() => setError('Không thể tải chi tiết đề xuất.'))
            .finally(() => setLoading(false));
    }, [suggestionId]);

    const canAction = detail &&
        (detail.status === 'PENDING' || detail.status === 'REVIEWING');

    const handleApprove = async () => {
        if (!detail) return;
        setApproving(true);
        try {
            await approveSuggestion(detail.id);
            setActionMsg('Đã duyệt thành công!');
            setTimeout(() => {
                onActionDone();
                onClose();
            }, 1200);
        } catch {
            setActionMsg('Duyệt thất bại. Vui lòng thử lại.');
        } finally {
            setApproving(false);
        }
    };

    const handleRejectConfirm = async (reason: string) => {
        if (!detail) return;
        await rejectSuggestion(detail.id, {rejectReason: reason});
        setShowReject(false);
        setActionMsg('Đã từ chối đề xuất.');
        setTimeout(() => {
            onActionDone();
            onClose();
        }, 1200);
    };

    return (
        <>
            <div className={styles.backdrop}>
                <div className={styles.modal}>

                    {/* Header */}
                    <div className={styles.modalHeader}>
                        <span className={styles.modalTitle}>Chi tiết đề xuất #{suggestionId}</span>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={16}/>
                        </button>
                    </div>

                    {/* Body */}
                    <div className={styles.modalBody}>
                        {loading && (
                            <div className={styles.loadingWrap}>
                                <Loader2 size={24} className={styles.spin}/>
                                <span>Đang tải...</span>
                            </div>
                        )}

                        {error && <p className={styles.errorMsg}>{error}</p>}

                        {!loading && !error && detail && (
                            <>
                                {/* User info */}
                                <div className={styles.userRow}>
                                    {avatar
                                        ? <img src={avatar} className={styles.avatar} alt=""/>
                                        : (
                                            <div className={styles.avatarFallback}>
                                                {userName[0]?.toUpperCase() ?? '?'}
                                            </div>
                                        )
                                    }
                                    <div>
                                        <p className={styles.userName}>{userName}</p>
                                        <p className={styles.userSub}>
                                            <User size={11}/> ID #{detail.userId}
                                        </p>
                                    </div>
                                    <span className={`${styles.statusBadge} ${STATUS_CLASS[detail.status] ?? ''}`}>
                                        {STATUS_LABEL[detail.status] ?? detail.status}
                                    </span>
                                </div>

                                {/* Meta */}
                                <div className={styles.metaGrid}>
                                    <div className={styles.metaItem}>
                                        <Hash size={12}/>
                                        <span className={styles.metaLabel}>Template</span>
                                        <span className={styles.metaVal}>#{detail.templateId}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <Hash size={12}/>
                                        <span className={styles.metaLabel}>Fork</span>
                                        <span className={styles.metaVal}>#{detail.forkId ?? '—'}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <FileText size={12}/>
                                        <span className={styles.metaLabel}>Loại</span>
                                        <span className={styles.metaVal}>
                                            {TYPE_LABEL[detail.suggestionType] ?? detail.suggestionType}
                                        </span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <Clock size={12}/>
                                        <span className={styles.metaLabel}>Ngày tạo</span>
                                        <span className={styles.metaVal}>{formatDate(detail.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className={styles.section}>
                                    <p className={styles.sectionLabel}>Mô tả đề xuất</p>
                                    <p className={styles.descText}>{detail.description}</p>
                                </div>

                                {/* Fork content */}
                                {detail.forkTitle && (
                                    <div className={styles.section}>
                                        <p className={styles.sectionLabel}>Nội dung fork</p>
                                        <p className={styles.forkTitle}>{detail.forkTitle}</p>
                                        {detail.forkContent && (
                                            <pre className={styles.forkContent}>{detail.forkContent}</pre>
                                        )}
                                        {detail.forkFileUrl && (
                                            <a
                                                href={detail.forkFileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={styles.fileLink}
                                            >
                                                Xem file đính kèm →
                                            </a>
                                        )}
                                        <p className={styles.forkMeta}>
                                            Chỉnh sửa lần cuối: {formatDate(detail.forkLastEditedAt)}
                                        </p>
                                    </div>
                                )}

                                {/* Action result message */}
                                {actionMsg && (
                                    <div className={styles.actionMsg}>{actionMsg}</div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {!loading && !error && canAction && (
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.rejectBtn}
                                onClick={() => setShowReject(true)}
                                disabled={approving}
                            >
                                <XCircle size={14}/> Từ chối
                            </button>
                            <button
                                className={styles.approveBtn}
                                onClick={handleApprove}
                                disabled={approving}
                            >
                                {approving
                                    ? <Loader2 size={14} className={styles.spin}/>
                                    : <CheckCircle size={14}/>
                                }
                                {approving ? 'Đang duyệt...' : 'Duyệt & Merge'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject modal */}
            {showReject && detail && (
                <RejectModal
                    suggestionId={detail.id}
                    onConfirm={handleRejectConfirm}
                    onClose={() => setShowReject(false)}
                />
            )}
        </>
    );
}