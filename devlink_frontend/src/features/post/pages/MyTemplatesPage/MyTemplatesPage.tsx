import { useEffect, useState, useCallback } from 'react';
import {
    Eye, GitFork, Download, MessageSquare,
    Sparkles, RefreshCw, BookOpen,
    SlidersHorizontal, FileCode, FileText, Film,
    Table, File,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyTemplates, getTemplateMetaOptions, forkTemplate } from '../../../../api/post-service/learningTemplateApi';
import type { MyTemplateResponse, TemplateMetaOptions } from '../../../../types/template.types';
import styles from './MyTemplatesPage.module.css';
import TemplateDetailModal from '../../../post/components/TemplateDetailModal.tsx';
import { getMyForks } from '../../../../api/post-service/userTemplateForkApi.ts';
import SuggestionModal from '../../components/Suggestionmodal.tsx';

function getDifficultyLabel(d: string): string {
    const map: Record<string, string> = {
        BEGINNER: 'Cơ bản',
        INTERMEDIATE: 'Trung bình',
        ADVANCED: 'Nâng cao',
    };
    return map[d] ?? d;
}

function getDiffClass(difficulty: string): string {
    const map: Record<string, string> = {
        BEGINNER: styles.diffBeginner,
        INTERMEDIATE: styles.diffIntermediate,
        ADVANCED: styles.diffAdvanced,
    };
    return map[difficulty] ?? styles.diffBeginner;
}

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
    forkId: number | undefined;
    onDetail: (id: number) => void;
    onFork: (id: number) => Promise<void>;
    onSuggest: (templateId: number, forkId: number) => void; // thêm
}

function TemplateCard({ tpl, forkId, onDetail, onFork, onSuggest }: TemplateCardProps) {
    const [forking, setForking] = useState(false);
    const navigate = useNavigate();

    const handleFork = async () => {
        setForking(true);
        try {
            await onFork(tpl.id);
        } finally {
            setForking(false);
        }
    };


    return (
        <div className={styles.card}>
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

            <h3 className={styles.cardTitle}>{tpl.title}</h3>

            {(tpl.aiSummary ?? tpl.description) && (
                <p className={styles.cardDesc}>{tpl.aiSummary ?? tpl.description}</p>
            )}

            <p className={styles.cardFileName}>
                {getFileTypeIcon(tpl.fileType)}
                <span className={styles.fileNameText}>{tpl.fileName}</span>
                {tpl.fileSize > 0 && (
                    <span className={styles.fileSize}>{formatSize(tpl.fileSize)}</span>
                )}
            </p>

            <div className={styles.cardMeta}>
                <span><Eye size={12} />{tpl.viewCount}</span>
                <span><GitFork size={12} />{tpl.forkCount}</span>
                <span>{formatDate(tpl.createdAt)}</span>
            </div>

            <div className={styles.cardDivider} />

            <div className={styles.actions}>
                <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => onDetail(tpl.id)}
                >
                    <Eye size={13} /> Xem chi tiết
                </button>

                {tpl.isFork ? (
                    <button
                        className={`${styles.btn} ${styles.btnSuccess}`}
                        onClick={() => navigate(`/forks/${forkId}/edit`)}
                        disabled={!forkId}
                    >
                        <BookOpen size={13} /> Sửa fork
                    </button>
                ) : (
                    <button
                        className={`${styles.btn} ${styles.btnOutline}`}
                        onClick={handleFork}
                        disabled={forking || tpl.fileType === 'VIDEO'}
                    >
                        <GitFork size={13} /> {forking ? 'Đang fork...' : 'Fork'}
                    </button>
                )}

                <button className={`${styles.btn} ${styles.btnOutline}`}>
                    <Download size={13} /> Tải xuống
                </button>

                {tpl.isFork && forkId && (
                    <button
                        className={`${styles.btn} ${styles.btnOutline}`}

                        onClick={() => { if (forkId) onSuggest(tpl.id, forkId); }}
                    >
                        <MessageSquare size={13} /> Đề xuất sửa
                    </button>
                )}

                <button className={`${styles.btn} ${styles.btnAI}`}>
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
    const [templates, setTemplates]     = useState<MyTemplateResponse[]>([]);
    const [meta, setMeta]               = useState<TemplateMetaOptions | null>(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState<string | null>(null);
    const [hint, setHint]               = useState<string | null>(null);
    const [total, setTotal]             = useState(0);
    const [difficulty, setDifficulty]   = useState('');
    const [fileTypeFilter, setFileType] = useState('');
    const [forkOnly, setForkOnly]       = useState(false);
    const [detailId, setDetailId]       = useState<number | null>(null);
    const [forkMap, setForkMap]         = useState<Record<number, number>>({});

    useEffect(() => {
        getTemplateMetaOptions().then(setMeta).catch(() => undefined);
    }, []);

    const fetchForkMap = useCallback(async () => {
        try {
            const forks = await getMyForks();
            const map: Record<number, number> = {};
            forks.forEach(f => { map[f.templateId] = f.forkId; });
            setForkMap(map);
        } catch {
            // bỏ qua lỗi forkMap
        }
    }, []);

    const [suggestionTarget, setSuggestionTarget] = useState<{
        templateId: number;
        forkId: number;
    } | null>(null);

    useEffect(() => {
        (async () => { await fetchForkMap(); })();
    }, [fetchForkMap]);

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
        (async () => { await fetchTemplates(); })();
    }, [fetchTemplates]);
    const handleFork = async (templateId: number) => {
        try {
            await forkTemplate(templateId);
            await fetchTemplates();
            await fetchForkMap();
        } catch {
            alert('Fork thất bại. Vui lòng thử lại.');
        }
    };

    const displayed = templates.filter(t => {
        if (fileTypeFilter && t.fileType !== fileTypeFilter) return false;
        if (forkOnly && !t.isFork) return false;
        return true;
    });

    return (
        <div className={styles.page}>

            {!loading && hint && (
                <div className={styles.hintBar}>
                    <BookOpen size={15} />
                    <span>{hint}</span>
                </div>
            )}

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

            <div className={styles.filterBar}>
                <SlidersHorizontal size={15} color="#9CA3AF" />

                <select
                    className={styles.select}
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    disabled={loading || !meta}
                >
                    <option value="">Tất cả độ khó</option>
                    {meta?.difficultly.map(d => (
                        <option key={d} value={d}>{getDifficultyLabel(d)}</option>
                    ))}
                </select>

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

            {!loading && error && (
                <div className={styles.errorBox}>
                    <span>{error}</span>
                    <button onClick={() => { void fetchTemplates(); }}>Thử lại</button>
                </div>
            )}

            {loading && (
                <div className={styles.grid}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            )}

            {!loading && !error && displayed.length === 0 && (
                <div className={styles.empty}>
                    <BookOpen size={40} strokeWidth={1.5} color="#D1D5DB" />
                    <p className={styles.emptyTitle}>Không có template nào</p>
                    <p className={styles.emptySub}>
                        Thử thay đổi bộ lọc hoặc cập nhật ngôn ngữ lập trình trong profile
                    </p>
                </div>
            )}

            {!loading && !error && displayed.length > 0 && (
                <div className={styles.grid}>
                    {displayed.map(tpl => (
                        <TemplateCard
                            key={tpl.id}
                            tpl={tpl}
                            forkId={forkMap[tpl.id]}
                            onDetail={setDetailId}
                            onFork={handleFork}
                            onSuggest={(templateId, forkId) => setSuggestionTarget({ templateId, forkId })}
                        />
                    ))}
                </div>
            )}

            {detailId !== null && (
                <TemplateDetailModal
                    templateId={detailId}
                    meta={meta}
                    onClose={() => setDetailId(null)}
                />
            )}

            {suggestionTarget !== null && (
                <SuggestionModal
                    templateId={suggestionTarget.templateId}
                    forkId={suggestionTarget.forkId}
                    onClose={() => setSuggestionTarget(null)}
                    onSuccess={() => {
                        setSuggestionTarget(null);
                        // optional: hiện toast hoặc reload
                    }}
                />
            )}
        </div>
    );
}