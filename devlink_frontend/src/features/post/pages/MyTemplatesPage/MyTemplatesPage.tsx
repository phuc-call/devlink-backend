import { useEffect, useState, useCallback } from 'react';
import {
    Eye, GitFork, Download, MessageSquare,
    Sparkles, RotateCcw, RefreshCw, BookOpen,
    SlidersHorizontal, FileCode, FileText, Film,
    Table, File,
} from 'lucide-react';
import { getMyTemplates, getTemplateMetaOptions } from '../../../../api/post-service/learningTemplateApi';
import type { MyTemplateResponse, TemplateMetaOptions } from '../../../../types/template.types';
import styles from './MyTemplatesPage.module.css';

// ─── helpers — lấy từ API, không hardcode ────────────────────────────────────

// Label difficulty: backend trả BEGINNER/INTERMEDIATE/ADVANCED
// Map sang tiếng Việt để hiển thị — nếu backend thêm mới sẽ fallback về chính giá trị đó
function getDifficultyLabel(d: string): string {
    const map: Record<string, string> = {
        BEGINNER: 'Cơ bản',
        INTERMEDIATE: 'Trung bình',
        ADVANCED: 'Nâng cao',
    };
    return map[d] ?? d; // fallback: hiển thị đúng tên backend trả về
}

// CSS class difficulty
function getDiffClass(difficulty: string): string {
    const map: Record<string, string> = {
        BEGINNER: styles.diffBeginner,
        INTERMEDIATE: styles.diffIntermediate,
        ADVANCED: styles.diffAdvanced,
    };
    return map[difficulty] ?? styles.diffBeginner;
}

// Icon fileType: backend trả CODE/PDF/DOCX/XLSX/VIDEO
// Nếu backend thêm type mới → fallback về File icon
function getFileTypeIcon(fileType: string): React.ReactNode {
    const map: Record<string, React.ReactNode> = {
        CODE:  <FileCode size={13} />,
        PDF:   <FileText size={13} />,
        DOCX:  <File     size={13} />,
        XLSX:  <Table    size={13} />,
        VIDEO: <Film     size={13} />,
    };
    return map[fileType] ?? <File size={13} />;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

function formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── TemplateCard ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
    tpl: MyTemplateResponse;
}

function TemplateCard({ tpl }: TemplateCardProps) {
    return (
        <div className={styles.card}>
            {/* badges — tất cả giá trị đều từ tpl, không hardcode */}
            <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.badgeLang}`}>
                    {tpl.language}
                </span>
                <div className={styles.badgeGroup}>
                    <span className={`${styles.badge} ${getDiffClass(tpl.difficulty)}`}>
                        {getDifficultyLabel(tpl.difficulty)}
                    </span>
                    <span className={`${styles.badge} ${styles.badgeFileType}`}>
                        {getFileTypeIcon(tpl.fileType)}
                        {tpl.fileType}
                    </span>
                    {tpl.isFork && (
                        <span className={`${styles.badge} ${styles.badgeFork}`}>
                            <GitFork size={11} />
                            Đã fork
                        </span>
                    )}
                </div>
            </div>

            {/* title */}
            <h3 className={styles.cardTitle}>{tpl.title}</h3>

            {/* summary / desc */}
            {(tpl.aiSummary ?? tpl.description) && (
                <p className={styles.cardDesc}>{tpl.aiSummary ?? tpl.description}</p>
            )}

            {/* filename */}
            <p className={styles.cardFileName}>
                {getFileTypeIcon(tpl.fileType)}
                <span className={styles.fileNameText}>{tpl.fileName}</span>
                {tpl.fileSize > 0 && (
                    <span className={styles.fileSize}>{formatSize(tpl.fileSize)}</span>
                )}
            </p>

            {/* meta */}
            <div className={styles.cardMeta}>
                <span><Eye size={12} />{tpl.viewCount}</span>
                <span><GitFork size={12} />{tpl.forkCount}</span>
                <span>{formatDate(tpl.createdAt)}</span>
            </div>

            <div className={styles.cardDivider} />

            {/* actions */}
            <div className={styles.actions}>
                {/* 3.3 getTemplateDetail */}
                <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    title="3.3 · getTemplateDetail"
                >
                    <Eye size={13} /> Xem chi tiết
                </button>

                {/* 3.4 forkTemplate | 3.5 updateFork */}
                {tpl.isFork ? (
                    <button
                        className={`${styles.btn} ${styles.btnSuccess}`}
                        title="3.5 · updateFork"
                    >
                        <BookOpen size={13} /> Sửa fork
                    </button>
                ) : (
                    <button
                        className={`${styles.btn} ${styles.btnOutline}`}
                        title="3.4 · forkTemplate"
                    >
                        <GitFork size={13} /> Fork
                    </button>
                )}

                {/* 3.7 downloadTemplate */}
                <button
                    className={`${styles.btn} ${styles.btnOutline}`}
                    title="3.7 · downloadTemplate"
                >
                    <Download size={13} /> Tải xuống
                </button>

                {/* 3.6 resetFork — chỉ khi đã fork */}
                {tpl.isFork && (
                    <button
                        className={`${styles.btn} ${styles.btnDanger}`}
                        title="3.6 · resetFork"
                    >
                        <RotateCcw size={13} /> Reset fork
                    </button>
                )}

                {/* 3.9 createSuggestion */}
                <button
                    className={`${styles.btn} ${styles.btnOutline}`}
                    title="3.9 · createSuggestion"
                >
                    <MessageSquare size={13} /> Đề xuất sửa
                </button>

                {/* 3.8 askTemplateAI */}
                <button
                    className={`${styles.btn} ${styles.btnAI}`}
                    title="3.8 · askTemplateAI"
                >
                    <Sparkles size={13} /> Hỏi Gemini AI
                </button>
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className={styles.card}>
            <div className={`${styles.skeleton} ${styles.skH5} ${styles.skW24}`} />
            <div className={`${styles.skeleton} ${styles.skH5} ${styles.skW80}`} />
            <div className={`${styles.skeleton} ${styles.skH4} ${styles.skWFull}`} />
            <div className={`${styles.skeleton} ${styles.skH4} ${styles.skW60}`} />
            <div className={`${styles.skeleton} ${styles.skH4} ${styles.skW40}`} />
        </div>
    );
}

// ─── MyTemplatesPage ──────────────────────────────────────────────────────────

export default function MyTemplatesPage() {
    const [templates, setTemplates] = useState<MyTemplateResponse[]>([]);
    // meta lấy từ API: { difficultly: string[], fileType: string[] }
    const [meta, setMeta]           = useState<TemplateMetaOptions | null>(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);
    const [hint, setHint]           = useState<string | null>(null);
    const [total, setTotal]         = useState(0);

    // filter state — giá trị đều từ meta API, không hardcode
    const [difficulty, setDifficulty]   = useState('');
    const [fileTypeFilter, setFileType] = useState('');
    const [forkOnly, setForkOnly]       = useState(false);

    // fetch meta từ GET /api/posts một lần khi mount
    useEffect(() => {
        getTemplateMetaOptions().then(setMeta).catch(() => undefined);
    }, []);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getMyTemplates({
                page: 0,
                size: 50,
                difficulty: difficulty || undefined,
            });
            setTemplates(data.content);
            setTotal(data.totalElements);
            setHint(data.hint);
        } catch {
            setError('Không thể tải danh sách template. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [difficulty]);

    useEffect(() => {
        void fetchTemplates();
    }, [fetchTemplates]);

    // client-side filter fileType + forkOnly
    // fileType filter dùng đúng giá trị backend trả về (CODE/PDF/DOCX/XLSX/VIDEO)
    const displayed = templates.filter(t => {
        if (fileTypeFilter && t.fileType !== fileTypeFilter) return false;
        if (forkOnly && !t.isFork) return false;
        return true;
    });

    return (
        <div className={styles.page}>

            {/* hint */}
            {!loading && hint && (
                <div className={styles.hintBar}>
                    <BookOpen size={15} />
                    <span>{hint}</span>
                </div>
            )}

            {/* header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Tài liệu học tập của tôi</h1>
                    {!loading && (
                        <p className={styles.pageSub}>
                            {total} template phù hợp với ngôn ngữ trong profile
                        </p>
                    )}
                </div>
                <button
                    className={styles.refreshBtn}
                    onClick={() => { void fetchTemplates(); }}
                    title="Tải lại"
                    disabled={loading}
                >
                    <RefreshCw size={15} className={loading ? styles.spinning : ''} />
                </button>
            </div>

            {/* filter bar — options đến từ meta API, không hardcode */}
            <div className={styles.filterBar}>
                <SlidersHorizontal size={15} color="#9CA3AF" />

                {/* difficulty từ meta.difficultly */}
                <select
                    className={styles.select}
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    disabled={loading || !meta}
                >
                    <option value="">Tất cả độ khó</option>
                    {meta?.difficultly.map(d => (
                        <option key={d} value={d}>
                            {getDifficultyLabel(d)}
                        </option>
                    ))}
                </select>

                {/* fileType từ meta.fileType */}
                <select
                    className={styles.select}
                    value={fileTypeFilter}
                    onChange={e => setFileType(e.target.value)}
                    disabled={loading || !meta}
                >
                    <option value="">Tất cả loại file</option>
                    {meta?.fileType.map(f => (
                        <option key={f} value={f}>{f}</option>
                    ))}
                </select>

                <button
                    className={`${styles.toggleBtn} ${forkOnly ? styles.toggleActive : ''}`}
                    onClick={() => setForkOnly(v => !v)}
                    disabled={loading}
                >
                    <GitFork size={13} />
                    Đã fork
                </button>

                {!loading && (
                    <span className={styles.resultCount}>{displayed.length} kết quả</span>
                )}
            </div>

            {/* error */}
            {!loading && error && (
                <div className={styles.errorBox}>
                    <span>{error}</span>
                    <button onClick={() => { void fetchTemplates(); }}>Thử lại</button>
                </div>
            )}

            {/* loading skeletons */}
            {loading && (
                <div className={styles.grid}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            )}

            {/* empty */}
            {!loading && !error && displayed.length === 0 && (
                <div className={styles.empty}>
                    <BookOpen size={40} strokeWidth={1.5} color="#D1D5DB" />
                    <p className={styles.emptyTitle}>Không có template nào</p>
                    <p className={styles.emptySub}>
                        Thử thay đổi bộ lọc hoặc cập nhật ngôn ngữ lập trình trong profile
                    </p>
                </div>
            )}

            {/* grid */}
            {!loading && !error && displayed.length > 0 && (
                <div className={styles.grid}>
                    {displayed.map(tpl => (
                        <TemplateCard key={tpl.id} tpl={tpl} />
                    ))}
                </div>
            )}
        </div>
    );
}