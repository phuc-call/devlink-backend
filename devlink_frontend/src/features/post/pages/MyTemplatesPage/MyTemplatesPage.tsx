import { useEffect, useState, useCallback, useRef } from 'react';
import {
    Eye, GitFork, Download, MessageSquare,
    Sparkles, RefreshCw, BookOpen,
    FileCode, FileText, Film,
    Table, File, MoreHorizontal, ChevronDown, Check,
    FolderOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyTemplates, getTemplateMetaOptions, forkTemplate } from '../../../../api/post-service/learningTemplateApi';
import type { MyTemplateResponse, TemplateMetaOptions } from '../../../../types/template.types';
import styles from './Mytemplatespage.module.css';
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
        CODE:  <FileCode size={18} />,
        PDF:   <FileText size={18} />,
        DOCX:  <File     size={18} />,
        XLSX:  <Table    size={18} />,
        VIDEO: <Film     size={18} />,
    };
    return map[fileType] ?? <File size={18} />;
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



interface TemplateCardProps {
    tpl: MyTemplateResponse;
    forkId: number | undefined;
    onDetail: (id: number) => void;
    onFork: (id: number) => Promise<void>;
    onSuggest: (templateId: number, forkId: number) => void;
}

function TemplateCard({ tpl, forkId, onDetail, onFork, onSuggest }: TemplateCardProps) {
    const [forking, setForking] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                    <h3 className={styles.cardTitle}>{tpl.title}</h3>
                    {tpl.isFork && (
                        <div className={styles.forkBadge} title="Đã fork">
                            <GitFork size={14} />
                        </div>
                    )}
                </div>
                <div className={styles.badgeGroup}>
                    <span className={`${styles.badge} ${styles.badgeLang}`}>
                        {tpl.language}
                    </span>
                    <span className={`${styles.badge} ${getDiffClass(tpl.difficulty)}`}>
                        {getDifficultyLabel(tpl.difficulty)}
                    </span>
                </div>
            </div>

            {(tpl.aiSummary ?? tpl.description) && (
                <p className={styles.cardDesc}>{tpl.aiSummary ?? tpl.description}</p>
            )}

            <div className={styles.fileAttachment}>
                <div className={styles.fileIconWrap}>
                    {getFileTypeIcon(tpl.fileType)}
                </div>
                <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{tpl.fileName}</span>
                    {tpl.fileSize > 0 && (
                        <span className={styles.fileSize}>{formatSize(tpl.fileSize)}</span>
                    )}
                </div>
            </div>

            <div className={styles.cardFooter}>
                <div className={styles.cardStats}>
                    <span title="Lượt xem"><Eye size={14} /> {tpl.viewCount}</span>
                    <span title="Lượt fork"><GitFork size={14} /> {tpl.forkCount}</span>
                    <span className={styles.date}>{formatDate(tpl.createdAt)}</span>
                </div>

                <div className={styles.cardActions}>
                    {tpl.isFork ? (
                        <button
                            className={`${styles.actionBtn} ${styles.primaryBtn}`}
                            onClick={() => navigate(`/forks/${forkId}/edit`)}
                            disabled={!forkId}
                        >
                            Sửa
                        </button>
                    ) : (
                        <button
                            className={`${styles.actionBtn} ${styles.outlineBtn}`}
                            onClick={handleFork}
                            disabled={forking || tpl.fileType === 'VIDEO'}
                        >
                            {forking ? '...' : 'Fork'}
                        </button>
                    )}
                    
                    <button
                        className={`${styles.actionBtn} ${styles.outlineBtn}`}
                        onClick={() => onDetail(tpl.id)}
                    >
                        Chi tiết
                    </button>

                    <div ref={menuRef} style={{ position: 'relative' }}>
                        <button 
                            className={`${styles.actionBtn} ${styles.iconBtn}`}
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <MoreHorizontal size={16} />
                        </button>
                        {showMenu && (
                            <div className={`${styles.dropdownMenu} ${styles.dropdownMenuBottom}`}>
                                <button className={styles.dropdownItem}>
                                    <Download size={14} /> Tải xuống
                                </button>
                                {tpl.isFork && forkId && (
                                    <button
                                        className={styles.dropdownItem}
                                        onClick={() => { setShowMenu(false); if (forkId) onSuggest(tpl.id, forkId); }}
                                    >
                                        <MessageSquare size={14} /> Đề xuất sửa
                                    </button>
                                )}
                                <button className={`${styles.dropdownItem} ${styles.dropdownAI}`}>
                                    <Sparkles size={14} /> Hỏi Gemini AI
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}



function SkeletonCard() {
    return (
        <div className={`${styles.skeleton} ${styles.skCard}`} />
    );
}



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

    const [suggestionTarget, setSuggestionTarget] = useState<{
        templateId: number;
        forkId: number;
    } | null>(null);

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
            // bỏ qua
        }
    }, []);

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
            <div className={styles.topSection}>
                <div className={styles.headerRow}>
                    <div className={styles.headerLeft}>
                        <div className={styles.titleBadge}>
                            <FolderOpen size={24} />
                        </div>
                        <div className={styles.headerText}>
                            <h2>Tài liệu của tôi</h2>
                            <p>
                                {loading ? 'Đang tải dữ liệu...' : (
                                    <>
                                        Tìm thấy <strong>{total}</strong> tài liệu phù hợp với bạn
                                        {hint && ` • ${hint}`}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        className={styles.refreshBtn}
                        onClick={() => { void fetchTemplates(); }}
                        title="Tải lại"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? styles.spinning : ''} />
                        Làm mới
                    </button>
                </div>

                <div className={styles.filterRow}>
                    <div className={styles.modernSelectWrap}>
                        <select
                            className={styles.modernSelect}
                            value={difficulty}
                            onChange={e => setDifficulty(e.target.value)}
                            disabled={loading || !meta}
                        >
                            <option value="">Tất cả độ khó</option>
                            {meta?.difficultly.map(d => (
                                <option key={d} value={d}>{getDifficultyLabel(d)}</option>
                            ))}
                        </select>
                        <ChevronDown className={styles.selectIcon} size={16} />
                    </div>

                    <div className={styles.modernSelectWrap}>
                        <select
                            className={styles.modernSelect}
                            value={fileTypeFilter}
                            onChange={e => setFileType(e.target.value)}
                            disabled={loading || !meta}
                        >
                            <option value="">Tất cả định dạng</option>
                            {meta?.fileType.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                        <ChevronDown className={styles.selectIcon} size={16} />
                    </div>

                    <label className={styles.modernCheckbox}>
                        <input 
                            type="checkbox" 
                            checked={forkOnly}
                            onChange={() => setForkOnly(!forkOnly)}
                            disabled={loading}
                        />
                        <div className={styles.checkboxBox}>
                            {forkOnly && <Check size={14} color="#fff" strokeWidth={3} />}
                        </div>
                        Chỉ hiện tài liệu đã fork
                    </label>
                </div>
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
                    <BookOpen size={48} strokeWidth={1} color="#9CA3AF" />
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
                    }}
                />
            )}
        </div>
    );
}