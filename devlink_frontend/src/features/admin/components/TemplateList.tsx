import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Eye, GitFork, Edit2, Trash2, ToggleLeft,
    FileCode, FileText, Film, Table, File,
    RefreshCw, SlidersHorizontal, BookOpen,
    ChevronLeft, ChevronRight, AlertCircle,
    Sparkles, X, Check,
} from 'lucide-react';
import {
    getAdminTemplates,
    getTemplateMetaOptions,
    getSupportedLanguages,
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
        CODE: <FileCode size={12} />,
        PDF: <FileText size={12} />,
        DOCX: <File size={12} />,
        XLSX: <Table size={12} />,
        VIDEO: <Film size={12} />,
    };
    return map[fileType] ?? <File size={12} />;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

interface StatCardProps { readonly label: string; readonly value: number | string; readonly color?: string }
function StatCard({ label, value, color }: StatCardProps) {
    return (
        <div className={styles.statCard}>
            <span className={styles.statLabel}>{label}</span>
            <span className={styles.statVal} style={color ? { color } : undefined}>{value}</span>
        </div>
    );
}

interface BadgeProps { readonly children: React.ReactNode; readonly className: string }
function Badge({ children, className }: BadgeProps) {
    return <span className={`${styles.badge} ${className}`}>{children}</span>;
}

interface ModalProps {
    readonly title: string;
    readonly onClose: () => void;
    readonly children: React.ReactNode;
}
function Modal({ title, onClose, children }: ModalProps) {
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
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
            <div className={styles.cardTop}>
                <div className={styles.badgeRow}>
                    <Badge className={styles.badgeLang}>{tpl.language}</Badge>
                    <Badge className={getDiffClass(tpl.difficulty)}>{DIFF_LABEL[tpl.difficulty] ?? tpl.difficulty}</Badge>
                    <Badge className={styles.badgeFile}>
                        {getFileIcon(tpl.fileType)}{tpl.fileType}
                    </Badge>
                    <Badge className={getStatusClass(tpl.status)}>{STATUS_LABEL[tpl.status] ?? tpl.status}</Badge>
                </div>
            </div>

            <h3 className={styles.cardTitle}>{tpl.title}</h3>

            {tpl.aiSummary ? (
                <p className={styles.cardSummary}>{tpl.aiSummary}</p>
            ) : (
                <p className={styles.cardSummaryEmpty}>
                    <Sparkles size={11} /> Chưa có AI tóm tắt
                </p>
            )}

            <div className={styles.cardFile}>
                {getFileIcon(tpl.fileType)}
                <span className={styles.fileName}>{tpl.fileName}</span>
            </div>

            <div className={styles.cardMeta}>
                <span><Eye size={12} />{tpl.viewCount ?? 0}</span>
                <span><GitFork size={12} />{tpl.forkCount ?? 0}</span>
                <span>{formatDate(String(tpl.createdAt))}</span>
            </div>

            <div className={styles.cardDivider} />

            <div className={styles.cardActions}>
                <button className={`${styles.btn} ${styles.btnBlue}`} onClick={() => onDetail(tpl)}>
                    <Eye size={12} /> Chi tiết
                </button>
                <button className={`${styles.btn} ${styles.btnDefault}`} onClick={() => onEdit(tpl)}>
                    <Edit2 size={12} /> Sửa
                </button>
                <button className={`${styles.btn} ${styles.btnDefault}`} onClick={() => onStatus(tpl)}>
                    <ToggleLeft size={12} /> Trạng thái
                </button>
                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => onDelete(tpl)}>
                    <Trash2 size={12} /> Xóa
                </button>
            </div>
        </div>
    );
}

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

const PAGE_SIZE = 10;

export default function TemplateList() {
    const [templates, setTemplates] = useState<TemplateCardResponse[]>([]);
    const [meta, setMeta] = useState<TemplateMetaOptions | null>(null);
    const [langOptions, setLangOptions] = useState<string[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalElements, setTotalElements] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [filterLang, setFilterLang] = useState('');
    const [filterDiff, setFilterDiff] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [detailId, setDetailId] = useState<number | null>(null);
    const [editModal, setEditModal] = useState<TemplateCardResponse | null>(null);
    const [statusModal, setStatusModal] = useState<TemplateCardResponse | null>(null);
    const [deleteModal, setDeleteModal] = useState<TemplateCardResponse | null>(null);

    const [editTitle, setEditTitle] = useState('');
    const [editDiff, setEditDiff] = useState('');

    const isInitialMount = useRef(true);

    const stats = {
        total: totalElements,
        active: templates.filter(t => t.status === 'ACTIVE').length,
        hidden: templates.filter(t => t.status === 'HIDDEN').length,
        deleted: templates.filter(t => t.status === 'DELETED').length,
    };

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            getTemplateMetaOptions().then((res) => { if (isMounted) setMeta(res); }).catch(() => undefined),
            getSupportedLanguages()
                .then((r: LanguageOptions) => { if (isMounted) setLangOptions(r.languages ?? []); })
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
        if (isInitialMount.current) {
            isInitialMount.current = false;
            void fetchTemplates(0);
        } else {
            void fetchTemplates(0);
        }
    }, [fetchTemplates]);

    const displayed = templates.filter(t => {
        if (filterLang && t.language !== filterLang) return false;
        if (filterStatus && t.status !== filterStatus) return false;
        return true;
    });

    function handleOpenEdit(t: TemplateCardResponse) {
        setEditTitle(t.title);
        setEditDiff(t.difficulty);
        setEditModal(t);
    }

    async function handleSubmitEdit() {
        if (!editModal) return;
        setEditModal(null);
    }

    async function handleChangeStatus(tpl: TemplateCardResponse, newStatus: string) {
        if (tpl && newStatus) {
            setStatusModal(null);
        }
    }

    async function handleDelete(tpl: TemplateCardResponse) {
        if (tpl.id) {
            setDeleteModal(null);
        }
    }

    function getStatusBtnClassName(s: string): string {
        if (s === 'ACTIVE') return styles.btnSuccess;
        if (s === 'HIDDEN') return styles.btnDefault;
        return styles.btnDanger;
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.statsRow}>
                <StatCard label="Tổng template" value={stats.total} />
                <StatCard label="Đang hoạt động" value={stats.active} color="#16A34A" />
                <StatCard label="Đã ẩn" value={stats.hidden} color="#F59E0B" />
                <StatCard label="Đã xóa" value={stats.deleted} color="#DC2626" />
            </div>

            <div className={styles.filterBar}>
                <SlidersHorizontal size={15} color="#9CA3AF" aria-hidden="true" />

                <select
                    className={styles.select}
                    value={filterLang}
                    onChange={e => setFilterLang(e.target.value)}
                    disabled={loading}
                    aria-label="Chọn ngôn ngữ"
                >
                    <option value="">Tất cả ngôn ngữ</option>
                    {langOptions.map(l => (
                        <option key={l} value={l}>{l}</option>
                    ))}
                </select>

                <select
                    className={styles.select}
                    value={filterDiff}
                    onChange={e => setFilterDiff(e.target.value)}
                    disabled={loading}
                    aria-label="Chọn độ khó"
                >
                    <option value="">Tất cả độ khó</option>
                    {(meta?.difficultly ?? []).map(d => (
                        <option key={d} value={d}>{DIFF_LABEL[d] ?? d}</option>
                    ))}
                </select>

                <select
                    className={styles.select}
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    disabled={loading}
                    aria-label="Chọn trạng thái"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="HIDDEN">Đã ẩn</option>
                    <option value="DELETED">Đã xóa</option>
                </select>

                <button
                    className={styles.refreshBtn}
                    onClick={() => void fetchTemplates(currentPage)}
                    disabled={loading}
                    aria-label="Tải lại"
                >
                    <RefreshCw size={14} className={loading ? styles.spinning : ''} />
                </button>

                {!loading && (
                    <span className={styles.resultCount}>{displayed.length} kết quả</span>
                )}
            </div>

            {!loading && error && (
                <div className={styles.errorBox}>
                    <AlertCircle size={15} />
                    <span>{error}</span>
                    <button className={styles.btnRetry} onClick={() => void fetchTemplates(currentPage)}>
                        Thử lại
                    </button>
                </div>
            )}

            {loading && (
                <div className={styles.grid}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard idKey={`skeleton-${i}`} key={`skeleton-${i}`} />
                    ))}
                </div>
            )}

            {!loading && !error && displayed.length === 0 && (
                <div className={styles.empty}>
                    <BookOpen size={40} strokeWidth={1.5} color="#D1D5DB" aria-hidden="true" />
                    <p className={styles.emptyTitle}>Không có template nào</p>
                    <p className={styles.emptySub}>Thử thay đổi bộ lọc hoặc upload template mới</p>
                </div>
            )}

            {!loading && !error && displayed.length > 0 && (
                <div className={styles.grid}>
                    {displayed.map(tpl => (
                        <TemplateCard
                            key={tpl.id}
                            tpl={tpl}
                            onDetail={(t) => setDetailId(t.id)}
                            onEdit={handleOpenEdit}
                            onStatus={setStatusModal}
                            onDelete={setDeleteModal}
                        />
                    ))}
                </div>
            )}

            {!loading && totalPages > 1 && (
                <div className={styles.pagination}>
                    <span className={styles.pageInfo}>
                        Trang {currentPage + 1} / {totalPages} · {totalElements} template
                    </span>
                    <div className={styles.pageBtns}>
                        <button
                            className={styles.pageBtn}
                            disabled={currentPage === 0}
                            onClick={() => void fetchTemplates(currentPage - 1)}
                            aria-label="Trang trước"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={`page-btn-${i}`}
                                className={`${styles.pageBtn} ${i === currentPage ? styles.pageBtnActive : ''}`}
                                onClick={() => void fetchTemplates(i)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            className={styles.pageBtn}
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => void fetchTemplates(currentPage + 1)}
                            aria-label="Trang sau"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {detailId !== null && (
                <TemplateDetailModal
                    templateId={detailId}
                    meta={meta}
                    onClose={() => setDetailId(null)}
                />
            )}

            {editModal && (
                <Modal title="Chỉnh sửa template" onClose={() => setEditModal(null)}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="edit-title-input">Tiêu đề</label>
                        <input
                            id="edit-title-input"
                            className={styles.formInput}
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="edit-diff-select">Độ khó</label>
                        <select
                            id="edit-diff-select"
                            className={styles.formSelect}
                            value={editDiff}
                            onChange={e => setEditDiff(e.target.value)}
                        >
                            {(meta?.difficultly ?? ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).map(d => (
                                <option key={d} value={d}>{DIFF_LABEL[d] ?? d}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.modalFooter}>
                        <button className={styles.btnCancel} onClick={() => setEditModal(null)}>Hủy</button>
                        <button className={`${styles.btn} ${styles.btnBlue}`} onClick={handleSubmitEdit}>
                            <Check size={12} /> Lưu thay đổi
                        </button>
                    </div>
                </Modal>
            )}

            {statusModal && (
                <Modal title="Thay đổi trạng thái" onClose={() => setStatusModal(null)}>
                    <div className={styles.modalDesc}>
                        Trạng thái hiện tại:{' '}
                        <Badge className={getStatusClass(statusModal.status)}>
                            {STATUS_LABEL[statusModal.status] ?? statusModal.status}
                        </Badge>
                    </div>
                    <div className={styles.statusBtnGroup}>
                        {(['ACTIVE', 'HIDDEN', 'DELETED'] as const)
                            .filter(s => s !== statusModal.status)
                            .map(s => (
                                <button
                                    key={s}
                                    className={`${styles.btn} ${getStatusBtnClassName(s)}`}
                                    onClick={() => handleChangeStatus(statusModal, s)}
                                >
                                    → {STATUS_LABEL[s]}
                                </button>
                            ))}
                    </div>
                    <div className={styles.modalFooter}>
                        <button className={styles.btnCancel} onClick={() => setStatusModal(null)}>Hủy</button>
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
                        Template sẽ bị đánh dấu DELETED, sinh viên không thể truy cập.
                    </p>
                    <div className={styles.modalFooter}>
                        <button className={styles.btnCancel} onClick={() => setDeleteModal(null)}>Hủy</button>
                        <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => handleDelete(deleteModal)}>
                            <Trash2 size={12} /> Xác nhận xóa
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}