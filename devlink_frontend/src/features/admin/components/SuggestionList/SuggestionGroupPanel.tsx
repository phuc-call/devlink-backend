import { useEffect, useState, useCallback } from 'react';
import {
    RefreshCw, ChevronLeft, ChevronRight,
    Trash2, Loader2, AlertTriangle, CheckCircle,
    Clock, Eye, ThumbsUp, ThumbsDown, XCircle, LayoutList,
} from 'lucide-react';
import axiosInstance from '../../../../api/axiosInstance';
import styles from './SuggestionGroupPanel.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type SuggestionStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface SuggestionSummary {
    id: number;
    forkId: number;
    userId: number;
    templateId: number;
    status: SuggestionStatus;
    createdAt: string;
}

interface SuggestionGroupResponse {
    count: number;
    items: SuggestionSummary[];
}

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

// GET /api/templates/suggestions/admin/grouped
async function getGroupedByStatus(): Promise<Record<string, SuggestionGroupResponse>> {
    const res = await axiosInstance.get('/api/templates/suggestions/admin/grouped');
    return res.data.data;
}

// GET /api/templates/suggestions/admin/group?status=X&page=0&size=10
async function getSuggestionsByStatus(
    status: SuggestionStatus,
    page = 0,
    size = 10,
): Promise<PageResponse<SuggestionSummary>> {
    const res = await axiosInstance.get('/api/templates/suggestions/admin/group', {
        params: { status, page, size },
    });
    return res.data.data;
}

// DELETE /api/templates/suggestions/admin/{suggestionId}
async function deleteSuggestion(suggestionId: number): Promise<void> {
    await axiosInstance.delete(`/api/templates/suggestions/admin/${suggestionId}`);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SuggestionStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING:   { label: 'Chờ duyệt',    color: '#D97706', bg: '#FFFBEB', icon: <Clock size={12} /> },
    REVIEWING: { label: 'Đang xem',     color: '#2563EB', bg: '#EFF6FF', icon: <Eye size={12} /> },
    APPROVED:  { label: 'Đã duyệt',     color: '#16A34A', bg: '#F0FDF4', icon: <ThumbsUp size={12} /> },
    REJECTED:  { label: 'Đã từ chối',   color: '#DC2626', bg: '#FEF2F2', icon: <ThumbsDown size={12} /> },
    CANCELLED: { label: 'Đã thu hồi',   color: '#6B7280', bg: '#F3F4F6', icon: <XCircle size={12} /> },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ─── GroupTab component ───────────────────────────────────────────────────────

interface GroupTabProps {
    status: SuggestionStatus;
    count: number;
    active: boolean;
    onClick: () => void;
}

function GroupTab({ status, count, active, onClick }: GroupTabProps) {
    const cfg = STATUS_CONFIG[status];
    return (
        <button
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={onClick}
            style={active ? { borderBottomColor: cfg.color, color: cfg.color } : {}}
        >
            <span className={styles.tabIcon} style={{ color: cfg.color }}>{cfg.icon}</span>
            {cfg.label}
            <span className={styles.tabBadge} style={{ background: cfg.bg, color: cfg.color }}>
                {count}
            </span>
        </button>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SuggestionGroupPanel() {
    const [grouped, setGrouped]           = useState<Record<string, SuggestionGroupResponse>>({});
    const [loadingGroup, setLoadingGroup] = useState(true);
    const [groupError, setGroupError]     = useState<string | null>(null);

    const [activeStatus, setActiveStatus]     = useState<SuggestionStatus | null>(null);
    const [detailItems, setDetailItems]       = useState<SuggestionSummary[]>([]);
    const [detailPage, setDetailPage]         = useState(0);
    const [detailTotal, setDetailTotal]       = useState(0);
    const [detailTotalPages, setDetailTotalPages] = useState(0);
    const [loadingDetail, setLoadingDetail]   = useState(false);

    const [deletingId, setDeletingId]         = useState<number | null>(null);
    const [deleteSuccess, setDeleteSuccess]   = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const PAGE_SIZE = 10;

    // ── Load grouped ───────────────────────────────────────────────────────────
    const loadGrouped = useCallback(async () => {
        setLoadingGroup(true);
        setGroupError(null);
        try {
            const data = await getGroupedByStatus();
            setGrouped(data);
            // auto-select tab đầu tiên có data
            if (!activeStatus) {
                const firstKey = Object.keys(data)[0] as SuggestionStatus | undefined;
                if (firstKey) setActiveStatus(firstKey);
            }
        } catch {
            setGroupError('Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoadingGroup(false);
        }
    }, [activeStatus]);

    useEffect(() => { void loadGrouped(); }, []);

    // ── Load detail khi đổi tab hoặc page ────────────────────────────────────
    useEffect(() => {
        if (!activeStatus) return;
        setLoadingDetail(true);
        void getSuggestionsByStatus(activeStatus, detailPage, PAGE_SIZE)
            .then(data => {
                setDetailItems(data.content);
                setDetailTotal(data.totalElements);
                setDetailTotalPages(data.totalPages);
            })
            .finally(() => setLoadingDetail(false));
    }, [activeStatus, detailPage]);

    const handleTabClick = (status: SuggestionStatus) => {
        setActiveStatus(status);
        setDetailPage(0);
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await deleteSuggestion(id);
            setDeleteSuccess(id);
            setTimeout(() => setDeleteSuccess(null), 2000);
            // cập nhật local list
            setDetailItems(prev => prev.filter(i => i.id !== id));
            setDetailTotal(prev => prev - 1);
            // cập nhật count trong grouped
            if (activeStatus) {
                setGrouped(prev => {
                    const group = prev[activeStatus];
                    if (!group) return prev;
                    return {
                        ...prev,
                        [activeStatus]: {
                            count: group.count - 1,
                            items: group.items.filter(i => i.id !== id),
                        },
                    };
                });
            }
        } catch {
            alert('Xoá thất bại. Vui lòng thử lại.');
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    const statusKeys = Object.keys(grouped) as SuggestionStatus[];

    return (
        <div className={styles.wrap}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <LayoutList size={16} color="#3B82F6" />
                    <span className={styles.title}>Quản lý đề xuất</span>
                    {!loadingGroup && (
                        <span className={styles.totalBadge}>
                            {Object.values(grouped).reduce((s, g) => s + g.count, 0)} tổng
                        </span>
                    )}
                </div>
                <button
                    className={styles.refreshBtn}
                    onClick={loadGrouped}
                    disabled={loadingGroup}
                    title="Tải lại"
                >
                    <RefreshCw size={14} className={loadingGroup ? styles.spin : ''} />
                </button>
            </div>

            {/* Error */}
            {groupError && (
                <div className={styles.error}>
                    <AlertTriangle size={14} /> {groupError}
                    <button onClick={loadGrouped}>Thử lại</button>
                </div>
            )}

            {/* Skeleton */}
            {loadingGroup && (
                <div className={styles.skeletonWrap}>
                    {[1, 2, 3].map(i => <div key={i} className={styles.skeletonTab} />)}
                </div>
            )}

            {/* Tabs */}
            {!loadingGroup && statusKeys.length > 0 && (
                <>
                    <div className={styles.tabs}>
                        {statusKeys.map(s => (
                            <GroupTab
                                key={s}
                                status={s}
                                count={grouped[s].count}
                                active={activeStatus === s}
                                onClick={() => handleTabClick(s)}
                            />
                        ))}
                    </div>

                    {/* Detail table */}
                    <div className={styles.tableWrap}>
                        {loadingDetail && (
                            <div className={styles.detailLoading}>
                                <Loader2 size={18} className={styles.spin} />
                            </div>
                        )}

                        {!loadingDetail && detailItems.length === 0 && (
                            <div className={styles.empty}>Không có đề xuất nào.</div>
                        )}

                        {!loadingDetail && detailItems.length > 0 && (
                            <table className={styles.table}>
                                <thead>
                                <tr>
                                    <th>#ID</th>
                                    <th>Template</th>
                                    <th>Fork</th>
                                    <th>User</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {detailItems.map(item => {
                                    const cfg = STATUS_CONFIG[item.status];
                                    const isDeleting = deletingId === item.id;
                                    const isDeleted  = deleteSuccess === item.id;
                                    return (
                                        <tr key={item.id} className={styles.row}>
                                            <td className={styles.idCell}>#{item.id}</td>
                                            <td className={styles.idCell}>#{item.templateId}</td>
                                            <td className={styles.idCell}>#{item.forkId}</td>
                                            <td className={styles.idCell}>#{item.userId}</td>
                                            <td>
                                                    <span
                                                        className={styles.statusBadge}
                                                        style={{ color: cfg.color, background: cfg.bg }}
                                                    >
                                                        {cfg.icon} {cfg.label}
                                                    </span>
                                            </td>
                                            <td className={styles.dateCell}>{formatDate(item.createdAt)}</td>
                                            <td>
                                                {isDeleted ? (
                                                    <span className={styles.deletedBadge}>
                                                            <CheckCircle size={13} /> Đã xoá
                                                        </span>
                                                ) : (
                                                    <button
                                                        className={styles.deleteBtn}
                                                        onClick={() => setConfirmDeleteId(item.id)}
                                                        disabled={isDeleting}
                                                        title="Xoá đề xuất"
                                                    >
                                                        {isDeleting
                                                            ? <Loader2 size={13} className={styles.spin} />
                                                            : <Trash2 size={13} />
                                                        }
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {detailTotalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setDetailPage(p => p - 1)}
                                disabled={detailPage === 0}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className={styles.pageInfo}>
                                {detailPage + 1} / {detailTotalPages}
                                <span className={styles.totalCount}>({detailTotal} mục)</span>
                            </span>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setDetailPage(p => p + 1)}
                                disabled={detailPage >= detailTotalPages - 1}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {!loadingGroup && statusKeys.length === 0 && !groupError && (
                <div className={styles.empty}>Chưa có đề xuất nào trong hệ thống.</div>
            )}

            {/* Confirm delete dialog */}
            {confirmDeleteId !== null && (
                <div className={styles.dialogBackdrop}>
                    <div className={styles.dialog}>
                        <AlertTriangle size={22} color="#EF4444" />
                        <h3 className={styles.dialogTitle}>Xoá đề xuất #{confirmDeleteId}?</h3>
                        <p className={styles.dialogDesc}>
                            Hành động này sẽ <strong>xoá vĩnh viễn</strong> đề xuất này khỏi hệ thống.
                        </p>
                        <div className={styles.dialogBtns}>
                            <button
                                className={styles.dialogConfirm}
                                onClick={() => handleDelete(confirmDeleteId)}
                                disabled={deletingId !== null}
                            >
                                {deletingId !== null
                                    ? <><Loader2 size={13} className={styles.spin} /> Đang xoá...</>
                                    : <><Trash2 size={13} /> Xác nhận xoá</>
                                }
                            </button>
                            <button className={styles.dialogCancel} onClick={() => setConfirmDeleteId(null)}>
                                Huỷ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}