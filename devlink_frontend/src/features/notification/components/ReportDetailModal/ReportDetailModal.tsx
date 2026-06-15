// src/features/notification/components/ReportDetailModal/ReportDetailModal.tsx
import { useEffect, useRef, useState } from 'react';
import {
    X, ShieldCheck, FileText, Tag, Image as ImageIcon,
    AlertCircle, Loader2, CheckCircle2, Clock,
} from 'lucide-react';
import { reportApi } from '../../../../api/post-service/reportApi';
import type { ReportDetailResponse, PostSnapshot, CommentSnapshot } from '../../../../types/report.types';
import styles from './ReportDetailModal.module.css';

// ── Helpers ───────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const REASON_LABEL: Record<string, string> = {
    SPAM:          'Spam',
    VIOLENCE:      'Bạo lực',
    INAPPROPRIATE: 'Nội dung không phù hợp',
    FAKE:          'Thông tin sai lệch',
    OTHER:         'Lý do khác',
};

const TARGET_LABEL: Record<string, string> = {
    POST:          'Bài viết',
    COMMENT:       'Bình luận',
    COMMENT_REPLY: 'Trả lời bình luận',
};

function isPostSnapshot(snap: PostSnapshot | CommentSnapshot): snap is PostSnapshot {
    return 'mediaUrls' in snap;
}

// ── Snapshot renderer ─────────────────────────────────────────────────
function SnapshotBlock({ content, contentDeleted, targetType }: {
    content: PostSnapshot | CommentSnapshot | null;
    contentDeleted: boolean;
    targetType: string;
}) {
    if (!content) {
        return (
            <div className={styles.snapshotExpired}>
                <Clock size={18} strokeWidth={1.6} />
                <p>Bản sao nội dung đã hết hạn (quá 7 ngày)</p>
            </div>
        );
    }

    const post = isPostSnapshot(content) ? content : null;
    const comment = !isPostSnapshot(content) ? content : null;

    return (
        <div className={`${styles.snapshotCard} ${contentDeleted ? styles.snapshotDeleted : ''}`}>
            {contentDeleted && (
                <div className={styles.deletedBanner}>
                    <AlertCircle size={13} strokeWidth={2} />
                    <span>Nội dung này đã bị xóa</span>
                </div>
            )}

            <div className={styles.snapshotMeta}>
                <span className={styles.snapshotType}>{TARGET_LABEL[targetType] ?? targetType}</span>
                <span className={styles.snapshotDate}>{formatDate(content.createdAt)}</span>
            </div>

            {content.content && (
                <p className={styles.snapshotContent}>{content.content}</p>
            )}

            {/* Tags — chỉ POST mới có */}
            {post && post.tags.length > 0 && (
                <div className={styles.snapshotTags}>
                    <Tag size={12} strokeWidth={2} />
                    {post.tags.map(t => (
                        <span key={t} className={styles.tag}>{t}</span>
                    ))}
                </div>
            )}

            {/* Media — chỉ POST mới có */}
            {post && post.mediaUrls.length > 0 && (
                <div className={styles.snapshotMedia}>
                    <div className={styles.mediaHeader}>
                        <ImageIcon size={13} strokeWidth={2} />
                        <span>{post.mediaUrls.length} ảnh/video</span>
                    </div>
                    <div className={styles.mediaGrid}>
                        {post.mediaUrls.slice(0, 4).map((url, i) => (
                            <div key={i} className={styles.mediaThumb}>
                                <img src={url} alt={`media-${i}`} />
                                {i === 3 && post.mediaUrls.length > 4 && (
                                    <div className={styles.mediaMore}>
                                        +{post.mediaUrls.length - 4}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Comment chỉ có postId */}
            {comment && (
                <p className={styles.snapshotCommentMeta}>
                    Thuộc bài viết #{comment.postId}
                </p>
            )}
        </div>
    );
}

// ── Main Modal ────────────────────────────────────────────────────────
interface ReportDetailModalProps {
    readonly notificationId: number;
    readonly onClose: () => void;
}

export default function ReportDetailModal({ notificationId, onClose }: ReportDetailModalProps) {
    const [data, setData] = useState<ReportDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLoading(true);
        setError('');
        reportApi.getReportDetail(notificationId)
            .then(res => setData(res.data.data))
            .catch(() => setError('Không thể tải chi tiết báo cáo. Thử lại sau.'))
            .finally(() => setLoading(false));
    }, [notificationId]);

    // Close khi click overlay
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    // Close khi nhấn Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
            <div className={styles.modal} role="dialog" aria-modal="true">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <ShieldCheck size={18} strokeWidth={2} />
                        </div>
                        <div>
                            <p className={styles.headerTitle}>Kết quả xét duyệt báo cáo</p>
                            <p className={styles.headerSub}>Báo cáo #{notificationId}</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {loading && (
                        <div className={styles.loadingWrap}>
                            <Loader2 size={28} strokeWidth={1.8} className={styles.spinner} />
                            <p>Đang tải...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className={styles.errorWrap}>
                            <AlertCircle size={28} strokeWidth={1.6} />
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && data && (
                        <>
                            {/* Kết quả */}
                            <div className={styles.resultBanner}>
                                <CheckCircle2 size={18} strokeWidth={2} />
                                <p>Nội dung được xác nhận vi phạm tiêu chuẩn cộng đồng và đã bị xử lý.</p>
                            </div>

                            {/* Thông tin báo cáo */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>
                                    <FileText size={14} strokeWidth={2} />
                                    <span>Thông tin báo cáo</span>
                                </div>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Loại nội dung</span>
                                        <span className={styles.infoValue}>
                                            {TARGET_LABEL[data.targetType] ?? data.targetType}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Lý do báo cáo</span>
                                        <span className={`${styles.infoValue} ${styles.reasonBadge}`}>
                                            {REASON_LABEL[data.reason] ?? data.reason}
                                        </span>
                                    </div>
                                    {data.description && (
                                        <div className={styles.infoRowFull}>
                                            <span className={styles.infoLabel}>Mô tả thêm</span>
                                            <p className={styles.description}>{data.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Nội dung bị báo cáo */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>
                                    <FileText size={14} strokeWidth={2} />
                                    <span>Nội dung bị báo cáo</span>
                                </div>
                                <SnapshotBlock
                                    content={data.targetContent}
                                    contentDeleted={data.contentDeleted}
                                    targetType={data.targetType}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && data && (
                    <div className={styles.footer}>
                        <button className={styles.closeFooterBtn} onClick={onClose}>
                            Đóng
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}