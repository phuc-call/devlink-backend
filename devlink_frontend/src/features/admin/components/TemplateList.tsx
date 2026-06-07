import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Eye, EyeOff, GitFork, Edit2, Trash2, ToggleRight,
    FileCode, FileText, Film, Table, File,
    RefreshCw, SlidersHorizontal, BookOpen,
    ChevronLeft, ChevronRight, AlertCircle,
    Sparkles, X, MoreVertical,
} from 'lucide-react';
import UpdateTemplateModal from '../../../features/post/components/Updatetemplatemodal';
import {
    getAdminTemplates,
    getTemplateMetaOptions,
    getSupportedLanguages,
    getTemplateStatuses,
    updateTemplateStatus,
} from '../../../api/post-service/learningTemplateApi';
import type {
    TemplateCardResponse,
    TemplateMetaOptions,
    LanguageOptions,
    AdminTemplateListResponse,
    GetAdminTemplatesParams,
} from '../../../types/template.types';
import styles from './TemplateList.module.css';
import TemplateDetailModal from '../../post/components/TemplateDetailModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFF_LABEL: Record<string, string> = {
    BEGINNER: 'Cơ bản',
    INTERMEDIATE: 'Trung bình',
    ADVANCED: 'Nâng cao',
};

const STATUS_LABEL: Record<string, string> = {
    ACTIVE: 'Hoạt động',
    HIDDEN: 'Đã ẩn',
    DELETED: 'Đã xóa',
};

function getDiffClass(d: string): string {
    return { BEGINNER: styles.diffB, INTERMEDIATE: styles.diffI, ADVANCED: styles.diffA }[d] ?? styles.diffB;
}

function getStatusClass(s: string): string {
    return { ACTIVE: styles.statusActive, HIDDEN: styles.statusHidden, DELETED: styles.statusDeleted }[s] ?? styles.statusActive;
}

function getFileIcon(fileType: string) {
    const map: Record<string, React.ReactNode> = {
        CODE:  <FileCode size={12} />,
        PDF:   <FileText size={12} />,
        DOCX:  <File     size={12} />,
        XLSX:  <Table    size={12} />,
        VIDEO: <Film     size={12} />,
    };
    return map[fileType] ?? <File size={12} />;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps { readonly children: React.ReactNode; readonly className: string }
function Badge({ children, className }: BadgeProps) {
    return <span className={`${styles.badge} ${className}`}>{children}</span>;
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

interface ModalProps {
    readonly title: string;
    readonly onClose: () => void;
    readonly children: React.ReactNode;
}
function Modal({ title, onClose, children }: ModalProps) {
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        globalThis.addEventListener('keydown', handleGlobalKeyDown);
        return () => globalThis.removeEventListener('keydown', handleGlobalKeyDown);
    }, [onClose]);

    return (
        <div
            className={styles.modalOverlay}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            aria-hidden="true"
        >
            <div className={styles.modal} role="dialog" aria-modal="true">
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>{title}</span>
                    <button className={styles.modalClose} onClick={onClose} aria-label="Đóng">
                        <X size={18} />
                    </button>
                </div>
                <div className={styles.modalBody}>{children}</div>
            </div>
        </div>
    );
}

// ─── Dropdown Menu (3 chấm) ───────────────────────────────────────────────────

interface CardMenuProps {
    tpl: TemplateCardResponse;
    onEdit: () => void;
    onStatus: () => void;
    onDelete: () => void;
}

function CardMenu({ tpl, onEdit, onStatus, onDelete }: CardMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isActive = tpl.status === 'ACTIVE';

    // đóng khi click ngoài
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className={styles.menuWrap} ref={ref}>
            <button
                className={styles.menuTrigger}
                onClick={() => setOpen(v => !v)}
                title="Thêm hành động"
                aria-label="Mở menu"
            >
                <MoreVertical size={15} />
            </button>

            {open && (
                <div className={styles.dropdown}>
                    <button
                        className={styles.dropdownItem}
                        onClick={() => { onEdit(); setOpen(false); }}
                    >
                        <Edit2 size={13} /> Chỉnh sửa
                    </button>
                    <button
                        className={styles.dropdownItem}
                        onClick={() => { onStatus(); setOpen(false); }}
                    >
                        {isActive
                            ? <><EyeOff size={13} /> Ẩn template</>
                            : <><ToggleRight size={13} /> Hiện template</>
                        }
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button
                        className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                        onClick={() => { onDelete(); setOpen(false); }}
                    >
                        <Trash2 size={13} /> Xóa template
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Template Card ────────────────────────────────────────────────────────────

interface TemplateCardProps {
    readonly tpl: TemplateCardResponse;
    readonly onDetail: (t: TemplateCardResponse) => void;
    readonly onEdit: (t: TemplateCardResponse) => void;
    readonly onStatus: (t: TemplateCardResponse) => void;
    readonly onDelete: (t: TemplateCardResponse) => void;
}

function TemplateCard({ tpl, onDetail, onEdit, onStatus, onDelete }: TemplateCardProps) {
    return (
        <div className={styles.card}>

            {/* Top: badges + menu */}
            <div className={styles.cardTop}>
                <div className={styles.badgeRow}>
                    {/* ngôn ngữ — xám trung tính */}
                    <Badge className={styles.badgeLang}>{tpl.language}</Badge>
                    {/* file type — xám nhạt */}
                    <Badge className={styles.badgeFile}>
                        {getFileIcon(tpl.fileType)}{tpl.fileType}
                    </Badge>
                </div>

                {/* 3-dot menu thay cho 3 nút phụ */}
                <CardMenu
                    tpl={tpl}
                    onEdit={() => onEdit(tpl)}
                    onStatus={() => onStatus(tpl)}
                    onDelete={() => onDelete(tpl)}
                />
            </div>

            {/* Tiêu đề */}
            <h3 className={styles.cardTitle}>{tpl.title}</h3>

            {/* Badges độ khó + trạng thái — chỉ 2 cái này mới dùng màu semantic */}
            <div className={styles.badgeRowSub}>
                <Badge className={getDiffClass(tpl.difficulty)}>
                    {DIFF_LABEL[tpl.difficulty] ?? tpl.difficulty}
                </Badge>
                <Badge className={getStatusClass(tpl.status)}>
                    {STATUS_LABEL[tpl.status] ?? tpl.status}
                </Badge>
            </div>

            {/* AI summary — chiều cao cố định, truncate 2 dòng */}
            <div className={styles.summaryBlock}>
                {tpl.aiSummary
                    ? <p className={styles.cardSummary}>{tpl.aiSummary}</p>
                    : (
                        <p className={styles.cardSummaryEmpty}>
                            <Sparkles size={11} /> Chưa có AI tóm tắt
                        </p>
                    )
                }
            </div>

            {/* Tên file — truncate */}
            <div className={styles.cardFile}>
                {getFileIcon(tpl.fileType)}
                <span className={styles.fileName} title={tpl.fileName}>
                    {tpl.fileName}
                </span>
            </div>

            {/* Meta: view, fork, ngày */}
            <div className={styles.cardMeta}>
                <span><Eye size={12} />{tpl.viewCount ?? 0}</span>
                <span><GitFork size={12} />{tpl.forkCount ?? 0}</span>
                <span>{formatDate(String(tpl.createdAt))}</span>
            </div>

            <div className={styles.cardDivider} />

            {/* Chỉ 1 nút chính */}
            <button
                className={styles.btnPrimary}
                onClick={() => onDetail(tpl)}
            >
                <Eye size={13} /> Xem chi tiết
            </button>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

interface SkeletonCardProps { readonly idKey: string }
function SkeletonCard({ idKey }: SkeletonCardProps) {
    return (
        <div key={idKey} className={styles.card}>
            <div className={`${styles.sk} ${styles.skBadge}`} />
            <div className={`${styles.sk} ${styles.skTitle}`} />
            <div className={`${styles.sk} ${styles.skLine}`} />
            <div className={`${styles.sk} ${styles.skLineShort}`} />
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function TemplateList() {
    const [templates, setTemplates]     = useState<TemplateCardResponse[]>([]);
    const [meta, setMeta]               = useState<TemplateMetaOptions | null>(null);
    const [langOptions, setLangOptions] = useState<string[]>([]);
    const [statusOptions, setStatusOptions] = useState<string[]>([]);

    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);
    const [totalElements, setTotalElements] = useState(0);
    const [currentPage, setCurrentPage]     = useState(0);
    const [totalPages, setTotalPages]       = useState(1);

    const [filterLang, setFilterLang]     = useState('');
    const [filterDiff, setFilterDiff]     = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [detailId, setDetailId]       = useState<number | null>(null);
    const [editModal, setEditModal]     = useState<TemplateCardResponse | null>(null);
    const [statusModal, setStatusModal] = useState<TemplateCardResponse | null>(null);
    const [deleteModal, setDeleteModal] = useState<TemplateCardResponse | null>(null);

    const isInitialMount = useRef(true);

    useEffect(() => {
        let isMounted = true;
        void Promise.all([
            getTemplateMetaOptions()
                .then(res => { if (isMounted) setMeta(res); })
                .catch(() => undefined),
            getSupportedLanguages()
                .then((r: LanguageOptions) => { if (isMounted) setLangOptions(r.languages ?? []); })
                .catch(() => undefined),
            getTemplateStatuses()
                .then(statuses => { if (isMounted) setStatusOptions(statuses); })
                .catch(() => undefined),
        ]);
        return () => { isMounted = false; };
    }, []);

    const fetchTemplates = useCallback(async (page = 0) => {
        setLoading(true);
        setError(null);
        try {
            const params: GetAdminTemplatesParams = {
                page,
                size: PAGE_SIZE,
                difficulty: filterDiff || undefined,
                status: filterStatus || undefined,
            };
            const data: AdminTemplateListResponse = await getAdminTemplates(params);
            setTemplates(data.content);
            setTotalElements(data.totalElements);
            setTotalPages(data.totalPages);
            setCurrentPage(data.page);
        } catch {
            setError('Không thể tải danh sách template. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [filterDiff]);

    useEffect(() => {
        if (isInitialMount.current) { isInitialMount.current = false; }
        void fetchTemplates(0);
    }, [fetchTemplates]);

    const displayed = templates.filter(t => {
        if (filterLang && t.language !== filterLang) return false;
        if (filterStatus && t.status !== filterStatus) return false;
        return true;
    });

    async function handleToggleStatus(tpl: TemplateCardResponse) {
        const newStatus = tpl.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
        try {
            await updateTemplateStatus(tpl.id, newStatus);
            setTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, status: newStatus } : t));
            setStatusModal(null);
        } catch { /* toast nếu cần */ }
    }

    async function handleDelete(tpl: TemplateCardResponse) {
        try {
            await updateTemplateStatus(tpl.id, 'DELETED');
            setTemplates(prev => prev.filter(t => t.id !== tpl.id));
            setDeleteModal(null);
        } catch { /* toast nếu cần */ }
    }

    return (
        <div className={styles.wrap}>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <SlidersHorizontal size={15} color="#9CA3AF" aria-hidden="true" />

                <select className={styles.select} value={filterLang}
                        onChange={e => setFilterLang(e.target.value)} disabled={loading} aria-label="Chọn ngôn ngữ">
                    <option value="">Tất cả ngôn ngữ</option>
                    {langOptions.map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                <select className={styles.select} value={filterDiff}
                        onChange={e => setFilterDiff(e.target.value)} disabled={loading} aria-label="Chọn độ khó">
                    <option value="">Tất cả độ khó</option>
                    {(meta?.difficultly ?? []).map(d => (
                        <option key={d} value={d}>{DIFF_LABEL[d] ?? d}</option>
                    ))}
                </select>

                <select className={styles.select} value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)} disabled={loading} aria-label="Chọn trạng thái">
                    <option value="">Tất cả trạng thái</option>
                    {statusOptions.filter(s => s !== 'DELETED').map(s => (
                        <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                    ))}
                </select>

                <button className={styles.refreshBtn}
                        onClick={() => void fetchTemplates(currentPage)} disabled={loading} aria-label="Tải lại">
                    <RefreshCw size={14} className={loading ? styles.spinning : ''} />
                </button>

                {!loading && <span className={styles.resultCount}>{displayed.length} kết quả</span>}
            </div>

            {/* Error */}
            {!loading && error && (
                <div className={styles.errorBox}>
                    <AlertCircle size={15} />
                    <span>{error}</span>
                    <button className={styles.btnRetry} onClick={() => void fetchTemplates(currentPage)}>
                        Thử lại
                    </button>
                </div>
            )}

            {/* Skeleton */}
            {loading && (
                <div className={styles.grid}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={`skeleton-${i}`} idKey={`skeleton-${i}`} />
                    ))}
                </div>
            )}

            {/* Empty */}
            {!loading && !error && displayed.length === 0 && (
                <div className={styles.empty}>
                    <BookOpen size={40} strokeWidth={1.5} color="#D1D5DB" aria-hidden="true" />
                    <p className={styles.emptyTitle}>Không có template nào</p>
                    <p className={styles.emptySub}>Thử thay đổi bộ lọc hoặc upload template mới</p>
                </div>
            )}

            {/* Grid */}
            {!loading && !error && displayed.length > 0 && (
                <div className={styles.grid}>
                    {displayed.map(tpl => (
                        <TemplateCard
                            key={tpl.id}
                            tpl={tpl}
                            onDetail={t => setDetailId(t.id)}
                            onEdit={setEditModal}
                            onStatus={setStatusModal}
                            onDelete={setDeleteModal}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className={styles.pagination}>
                    <span className={styles.pageInfo}>
                        Trang {currentPage + 1} / {totalPages} · {totalElements} template
                    </span>
                    <div className={styles.pageBtns}>
                        <button className={styles.pageBtn} disabled={currentPage === 0}
                                onClick={() => void fetchTemplates(currentPage - 1)} aria-label="Trang trước">
                            <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button key={`page-btn-${i}`}
                                    className={`${styles.pageBtn} ${i === currentPage ? styles.pageBtnActive : ''}`}
                                    onClick={() => void fetchTemplates(i)}>
                                {i + 1}
                            </button>
                        ))}
                        <button className={styles.pageBtn} disabled={currentPage >= totalPages - 1}
                                onClick={() => void fetchTemplates(currentPage + 1)} aria-label="Trang sau">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {detailId !== null && (
                <TemplateDetailModal templateId={detailId} meta={meta} onClose={() => setDetailId(null)} />
            )}

            {editModal && (
                <UpdateTemplateModal
                    template={editModal}
                    meta={meta}
                    onClose={() => setEditModal(null)}
                    onSuccess={updated => {
                        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
                    }}
                />
            )}

            {statusModal && (
                <Modal
                    title={statusModal.status === 'ACTIVE' ? 'Ẩn template' : 'Hiện template'}
                    onClose={() => setStatusModal(null)}
                >
                    <div className={styles.modalDesc}>
                        Trạng thái hiện tại:{' '}
                        <Badge className={getStatusClass(statusModal.status)}>
                            {STATUS_LABEL[statusModal.status] ?? statusModal.status}
                        </Badge>
                    </div>
                    <p className={styles.modalDescSub}>
                        {statusModal.status === 'ACTIVE'
                            ? 'Template sẽ bị ẩn, sinh viên sẽ không thể tìm thấy template này.'
                            : 'Template sẽ được hiển thị lại, sinh viên có thể truy cập.'
                        }
                    </p>
                    <div className={styles.modalFooter}>
                        <button className={styles.btnCancel} onClick={() => setStatusModal(null)}>Hủy</button>
                        <button
                            className={`${styles.btn} ${statusModal.status === 'ACTIVE' ? styles.btnDefault : styles.btnSuccess}`}
                            onClick={() => void handleToggleStatus(statusModal)}
                        >
                            {statusModal.status === 'ACTIVE'
                                ? <><EyeOff size={12} /> Xác nhận ẩn</>
                                : <><ToggleRight size={12} /> Xác nhận hiện</>
                            }
                        </button>
                    </div>
                </Modal>
            )}

            {deleteModal && (
                <Modal title="Xóa template" onClose={() => setDeleteModal(null)}>
                    <div className={styles.modalDesc}>
                        Bạn có chắc muốn xóa template{' '}
                        <strong>"{deleteModal.title}"</strong>?
                    </div>
                    <p className={styles.modalDescSub}>
                        Template sẽ bị xóa vĩnh viễn khỏi hệ thống, sinh viên không thể truy cập.
                    </p>
                    <div className={styles.modalFooter}>
                        <button className={styles.btnCancel} onClick={() => setDeleteModal(null)}>Hủy</button>
                        <button className={`${styles.btn} ${styles.btnDanger}`}
                                onClick={() => void handleDelete(deleteModal)}>
                            <Trash2 size={12} /> Xác nhận xóa
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}