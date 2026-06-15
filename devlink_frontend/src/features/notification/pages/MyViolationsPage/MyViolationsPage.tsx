
import { useEffect, useState } from 'react';
import {
    ShieldAlert, AlertTriangle, Clock, Infinity as InfinityIcon,
    FileText, Tag, Image as ImageIcon, Loader2, CheckCircle2,
    ChevronDown, ChevronUp,
} from 'lucide-react';
import { reportApi } from '../../../../api/post-service/reportApi';
import type { MyViolationResponse, PostSnapshot, CommentSnapshot } from '../../../../types/report.types';
import styles from './MyViolationsPage.module.css';

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

const RESTRICTION_LABEL: Record<string, { label: string; desc: string }> = {
    POST_BAN:    { label: 'Cấm đăng bài',    desc: 'Tài khoản không thể tạo bài viết mới' },
    COMMENT_BAN: { label: 'Cấm bình luận',   desc: 'Tài khoản không thể bình luận' },
    FULL_BAN:    { label: 'Khoá tài khoản',  desc: 'Tài khoản bị hạn chế toàn bộ tính năng' },
};

function isPostSnapshot(snap: PostSnapshot | CommentSnapshot): snap is PostSnapshot {
    return 'mediaUrls' in snap;
}

// ── Snapshot Block ────────────────────────────────────────────────────
function SnapshotBlock({ snapshot, targetType }: {
    snapshot: PostSnapshot | CommentSnapshot | null;
    targetType: string | null;
}) {
    if (!snapshot) {
        return (
            <div className={styles.snapshotExpired}>
                <Clock size={14} strokeWidth={1.8} />
                <span>Bản sao nội dung đã hết hạn (quá 7 ngày)</span>
            </div>
        );
    }

    const post = isPostSnapshot(snapshot) ? snapshot : null;
    const comment = !isPostSnapshot(snapshot) ? snapshot : null;

    return (
        <div className={styles.snapshotCard}>
            <div className={styles.snapshotHeader}>
                <span className={styles.snapshotTypeBadge}>
                    {TARGET_LABEL[targetType ?? ''] ?? targetType}
                </span>
                <span className={styles.snapshotDate}>{formatDate(snapshot.createdAt)}</span>
            </div>

            {snapshot.content && (
                <p className={styles.snapshotContent}>{snapshot.content}</p>
            )}

            {post && post.tags.length > 0 && (
                <div className={styles.snapshotTags}>
                    <Tag size={11} strokeWidth={2} />
                    {post.tags.map(t => (
                        <span key={t} className={styles.tag}>{t}</span>
                    ))}
                </div>
            )}

            {post && post.mediaUrls.length > 0 && (
                <div className={styles.mediaWrap}>
                    <div className={styles.mediaLabel}>
                        <ImageIcon size={12} strokeWidth={2} />
                        <span>{post.mediaUrls.length} ảnh/video</span>
                    </div>
                    <div className={styles.mediaGrid}>
                        {post.mediaUrls.slice(0, 4).map((url, i) => (
                            <div key={i} className={styles.mediaThumb}>
                                <img src={url} alt={`media-${i}`} />
                                {i === 3 && post.mediaUrls.length > 4 && (
                                    <div className={styles.mediaMore}>+{post.mediaUrls.length - 4}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {comment && (
                <p className={styles.commentMeta}>Thuộc bài viết #{comment.postId}</p>
            )}
        </div>
    );
}

// ── Violation Card ────────────────────────────────────────────────────
function ViolationCard({ v }: { v: MyViolationResponse }) {
    const [expanded, setExpanded] = useState(false);
    const restriction = RESTRICTION_LABEL[v.restrictionType];

    return (
        <div className={styles.card}>
            {/* Card Header */}
            <div className={styles.cardHeader}>
                <div className={styles.restrictionIconWrap}>
                    <ShieldAlert size={18} strokeWidth={1.8} />
                </div>
                <div className={styles.cardHeaderInfo}>
                    <p className={styles.restrictionLabel}>{restriction?.label ?? v.restrictionType}</p>
                    <p className={styles.restrictionDesc}>{restriction?.desc}</p>
                </div>
                <div className={styles.cardHeaderRight}>
                    {v.permanent ? (
                        <span className={styles.permanentBadge}>
                            <InfinityIcon size={11} strokeWidth={2} /> Vĩnh viễn
                        </span>
                    ) : (
                        <span className={styles.tempBadge}>
                            <Clock size={11} strokeWidth={2} /> Tạm thời
                        </span>
                    )}
                </div>
            </div>

            {/* Info Row */}
            <div className={styles.infoRow}>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Lý do</span>
                    <span className={styles.reasonBadge}>
                        {REASON_LABEL[v.reason] ?? v.reason}
                    </span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Ngày vi phạm</span>
                    <span className={styles.infoValue}>{formatDate(v.createdAt)}</span>
                </div>
                {!v.permanent && v.restrictedUntil && (
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Hết hạn</span>
                        <span className={styles.infoValue}>{formatDate(v.restrictedUntil)}</span>
                    </div>
                )}
            </div>

            {/* Divider + Toggle snapshot */}
            {v.targetType && (
                <>
                    <div className={styles.divider} />
                    <button
                        className={styles.toggleBtn}
                        onClick={() => setExpanded(p => !p)}
                    >
                        <FileText size={13} strokeWidth={2} />
                        <span>Nội dung bị vi phạm</span>
                        {expanded
                            ? <ChevronUp size={14} strokeWidth={2} />
                            : <ChevronDown size={14} strokeWidth={2} />
                        }
                    </button>

                    {expanded && (
                        <div className={styles.snapshotWrap}>
                            <SnapshotBlock
                                snapshot={v.deletedSnapshot}
                                targetType={v.targetType}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function MyViolationsPage() {
    const [violations, setViolations] = useState<MyViolationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        reportApi.getMyViolations()
            .then(res => setViolations(res.data.data))
            .catch(() => setError('Không thể tải danh sách vi phạm. Thử lại sau.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Page Header */}
                <div className={styles.pageHeader}>
                    <div className={styles.pageHeaderIcon}>
                        <ShieldAlert size={22} strokeWidth={1.8} />
                    </div>
                    <div>
                        <h1 className={styles.pageTitle}>Lịch sử vi phạm</h1>
                        <p className={styles.pageSub}>
                            Danh sách các nội dung của bạn đã bị xử lý vì vi phạm tiêu chuẩn cộng đồng
                        </p>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className={styles.loadingWrap}>
                        <Loader2 size={28} strokeWidth={1.8} className={styles.spinner} />
                        <p>Đang tải...</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className={styles.errorWrap}>
                        <AlertTriangle size={28} strokeWidth={1.6} />
                        <p>{error}</p>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && violations.length === 0 && (
                    <div className={styles.emptyWrap}>
                        <div className={styles.emptyIcon}>
                            <CheckCircle2 size={36} strokeWidth={1.4} />
                        </div>
                        <p className={styles.emptyTitle}>Không có vi phạm nào</p>
                        <p className={styles.emptySub}>
                            Tài khoản của bạn chưa có lịch sử vi phạm tiêu chuẩn cộng đồng
                        </p>
                    </div>
                )}

                {/* List */}
                {!loading && !error && violations.length > 0 && (
                    <div className={styles.list}>
                        {violations.map(v => (
                            <ViolationCard key={v.restrictionId} v={v} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}