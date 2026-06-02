import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, RotateCcw, Sparkles, Download,
    MessageSquare, Bold, Italic, Underline, List,
    AlignLeft, AlignCenter, AlignRight, ChevronDown,
    ChevronUp, X, Send, Loader2, AlertTriangle,
    CheckCircle, FileText, Clock, Hash,
} from 'lucide-react';
import axiosInstance from '../../../../api/axiosInstance';
import styles from './ForkEditorPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ForkDetail {
    id: number;
    templateId: number;
    title: string;
    content: string | null;
    fileUrl: string | null;
    isModified: boolean;
    lastEditedAt: string | null;
    createdAt: string;
}

interface ForkResponse {
    forkId: number;
    templateId: number;
    title: string;
    isModified: boolean;
}

// ─── API calls ────────────────────────────────────────────────────────────────

const getForkDetail = async (forkId: number): Promise<ForkDetail> => {
    const res = await axiosInstance.get(`/api/posts/forks/${forkId}`);
    // backend trả thẳng ForkDetailResponse (không wrap data)
    return res.data;
};

const updateFork = async (forkId: number, content: string, title?: string): Promise<ForkResponse> => {
    const res = await axiosInstance.patch(`/api/posts/forks/${forkId}`, { content, title });
    return res.data.data;
};

const resetFork = async (forkId: number): Promise<ForkResponse> => {
    const res = await axiosInstance.put(`/api/posts/forks/${forkId}/reset`);
    return res.data.data;
};

const askAI = async (templateId: number, question: string, contextCode?: string) => {
    const res = await axiosInstance.post(`/api/posts/templates/${templateId}/ask`, {
        question,
        contextCode: contextCode || undefined,
    });
    return res.data.data;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function wordCount(text: string) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
    return (
        <button className={styles.toolBtn} title={title} onClick={onClick} type="button">
            {icon}
        </button>
    );
}

// ─── AI Panel ─────────────────────────────────────────────────────────────────

interface AIPanelProps {
    templateId: number;
    selectedText: string;
    onClose: () => void;
}

function AIPanel({ templateId, selectedText, onClose }: AIPanelProps) {
    const [question, setQuestion]   = useState('');
    const [answer, setAnswer]       = useState<string | null>(null);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState(false);

    const handleAsk = async () => {
        if (!question.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await askAI(templateId, question, selectedText || undefined);
            setAnswer(res?.answer ?? 'Không có phản hồi.');
        } catch {
            setError('Gemini AI tạm thời không khả dụng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${styles.aiPanel} ${collapsed ? styles.aiPanelCollapsed : ''}`}>
            <div className={styles.aiHeader}>
                <div className={styles.aiTitle}>
                    <Sparkles size={15} color="#8B5CF6" />
                    <span>Hỏi Gemini AI</span>
                </div>
                <div className={styles.aiHeaderActions}>
                    <button
                        className={styles.aiToggleBtn}
                        onClick={() => setCollapsed(v => !v)}
                        title={collapsed ? 'Mở rộng' : 'Thu nhỏ'}
                    >
                        {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button className={styles.aiCloseBtn} onClick={onClose} title="Đóng">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {!collapsed && (
                <div className={styles.aiBody}>
                    {/* selected context */}
                    {selectedText && (
                        <div className={styles.contextBox}>
                            <span className={styles.contextLabel}>Đoạn được chọn:</span>
                            <p className={styles.contextText}>{selectedText.slice(0, 200)}{selectedText.length > 200 ? '...' : ''}</p>
                        </div>
                    )}

                    {/* question input */}
                    <div className={styles.aiInputWrap}>
                        <textarea
                            className={styles.aiInput}
                            placeholder="Nhập câu hỏi về nội dung file... (max 1000 ký tự)"
                            value={question}
                            onChange={e => setQuestion(e.target.value.slice(0, 1000))}
                            rows={3}
                            disabled={loading}
                        />
                        <div className={styles.aiInputMeta}>
                            <span className={styles.charCount}>{question.length}/1000</span>
                            <button
                                className={styles.askBtn}
                                onClick={handleAsk}
                                disabled={loading || !question.trim()}
                            >
                                {loading
                                    ? <Loader2 size={13} className={styles.spin} />
                                    : <Send size={13} />
                                }
                                {loading ? 'Đang hỏi...' : 'Hỏi AI'}
                            </button>
                        </div>
                    </div>

                    {/* error */}
                    {error && (
                        <div className={styles.aiError}>
                            <AlertTriangle size={13} /> {error}
                        </div>
                    )}

                    {/* answer */}
                    {answer && (
                        <div className={styles.answerBox}>
                            <div className={styles.answerLabel}>
                                <Sparkles size={12} /> Gemini trả lời:
                            </div>
                            <p className={styles.answerText}>{answer}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ForkEditorPage() {
    const { forkId } = useParams<{ forkId: string }>();
    const navigate   = useNavigate();

    const [fork, setFork]           = useState<ForkDetail | null>(null);
    const [content, setContent]     = useState('');
    const [title, setTitle]         = useState('');
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);
    const [saving, setSaving]       = useState(false);
    const [resetting, setResetting] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const [saveSuccess, setSaveSuccess]   = useState(false);

    // AI panel
    const [showAI, setShowAI]           = useState(false);
    const [selectedText, setSelectedText] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ── fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!forkId) return;
        setLoading(true);
        getForkDetail(Number(forkId))
            .then(data => {
                setFork(data);
                setContent(data.content ?? '');
                setTitle(data.title ?? '');
            })
            .catch(() => setError('Không thể tải nội dung. Vui lòng thử lại.'))
            .finally(() => setLoading(false));
    }, [forkId]);

    // ── auto-detect selected text for AI ──────────────────────────────────────
    const handleSelect = useCallback(() => {
        const sel = window.getSelection()?.toString() ?? '';
        if (sel.trim()) setSelectedText(sel);
    }, []);

    // ── toolbar helpers ────────────────────────────────────────────────────────
    const insertAround = (before: string, after: string = before) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end   = ta.selectionEnd;
        const sel   = content.slice(start, end);
        const next  = content.slice(0, start) + before + sel + after + content.slice(end);
        setContent(next);
        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const insertLine = (prefix: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start    = ta.selectionStart;
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
        setContent(next);
        setTimeout(() => ta.focus(), 0);
    };

    // ── save ───────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!forkId) return;
        setSaving(true);
        try {
            const updated = await updateFork(Number(forkId), content, title);
            setFork(prev => prev ? { ...prev, isModified: updated.isModified, title: updated.title } : prev);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch {
            alert('Lưu thất bại. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    // ── reset ──────────────────────────────────────────────────────────────────
    const handleReset = async () => {
        if (!forkId) return;
        setResetting(true);
        try {
            await resetFork(Number(forkId));
            // reload data
            const fresh = await getForkDetail(Number(forkId));
            setFork(fresh);
            setContent(fresh.content ?? '');
            setTitle(fresh.title ?? '');
            setConfirmReset(false);
        } catch {
            alert('Reset thất bại. Vui lòng thử lại.');
        } finally {
            setResetting(false);
        }
    };

    // ── keyboard shortcut Ctrl+S ───────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                void handleSave();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [content, title]);

    // ─── render ────────────────────────────────────────────────────────────────

    if (loading) return (
        <div className={styles.loadingPage}>
            <Loader2 size={32} className={styles.spin} />
            <span>Đang tải nội dung...</span>
        </div>
    );

    if (error) return (
        <div className={styles.errorPage}>
            <AlertTriangle size={28} color="#EF4444" />
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={() => navigate(-1)}>Quay lại</button>
        </div>
    );

    return (
        <div className={styles.page}>

            {/* ── Top bar ── */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Quay lại
                    </button>
                    <div className={styles.titleWrap}>
                        <input
                            className={styles.titleInput}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Tiêu đề fork..."
                        />
                        {fork?.isModified && (
                            <span className={styles.modifiedDot} title="Đã chỉnh sửa" />
                        )}
                    </div>
                </div>

                <div className={styles.topRight}>
                    {/* suggestion button — 3.9 */}
                    <button className={`${styles.topBtn} ${styles.btnGhost}`} title="3.9 · Đề xuất sửa">
                        <MessageSquare size={14} /> Đề xuất sửa
                    </button>

                    {/* download — 3.7 */}
                    <button className={`${styles.topBtn} ${styles.btnGhost}`} title="3.7 · Tải xuống">
                        <Download size={14} /> Tải xuống
                    </button>

                    {/* AI */}
                    <button
                        className={`${styles.topBtn} ${styles.btnAI} ${showAI ? styles.btnAIActive : ''}`}
                        onClick={() => setShowAI(v => !v)}
                        title="3.8 · Hỏi Gemini AI"
                    >
                        <Sparkles size={14} /> Gemini AI
                    </button>

                    {/* reset */}
                    <button
                        className={`${styles.topBtn} ${styles.btnDanger}`}
                        onClick={() => setConfirmReset(true)}
                        disabled={resetting}
                        title="3.6 · Reset fork"
                    >
                        <RotateCcw size={14} /> Reset
                    </button>

                    {/* save */}
                    <button
                        className={`${styles.topBtn} ${styles.btnSave} ${saveSuccess ? styles.btnSaved : ''}`}
                        onClick={handleSave}
                        disabled={saving}
                        title="Lưu (Ctrl+S)"
                    >
                        {saving
                            ? <Loader2 size={14} className={styles.spin} />
                            : saveSuccess
                                ? <CheckCircle size={14} />
                                : <Save size={14} />
                        }
                        {saving ? 'Đang lưu...' : saveSuccess ? 'Đã lưu!' : 'Lưu'}
                    </button>
                </div>
            </div>

            {/* ── Meta strip ── */}
            <div className={styles.metaStrip}>
                <span><FileText size={12} /> fork #{fork?.id}</span>
                <span><Hash size={12} /> template #{fork?.templateId}</span>
                <span><Clock size={12} /> Sửa lần cuối: {formatDate(fork?.lastEditedAt ?? null)}</span>
                <span className={styles.wordCount}>{wordCount(content)} từ · {content.length} ký tự</span>
            </div>

            {/* ── Editor area ── */}
            <div className={styles.editorWrap}>

                {/* Formatting toolbar */}
                <div className={styles.toolbar}>
                    <ToolBtn icon={<Bold size={14}/>}      title="In đậm (**text**)"    onClick={() => insertAround('**')} />
                    <ToolBtn icon={<Italic size={14}/>}    title="In nghiêng (*text*)"  onClick={() => insertAround('*')} />
                    <ToolBtn icon={<Underline size={14}/>} title="Gạch chân (__text__)" onClick={() => insertAround('__')} />
                    <div className={styles.toolDivider} />
                    <ToolBtn icon={<List size={14}/>}       title="Danh sách (- item)"  onClick={() => insertLine('- ')} />
                    <ToolBtn icon={<AlignLeft size={14}/>}  title="Tiêu đề (# )"        onClick={() => insertLine('# ')} />
                    <ToolBtn icon={<AlignCenter size={14}/>} title="Tiêu đề 2 (## )"   onClick={() => insertLine('## ')} />
                    <ToolBtn icon={<AlignRight size={14}/>}  title="Tiêu đề 3 (### )"  onClick={() => insertLine('### ')} />
                    <div className={styles.toolDivider} />
                    <ToolBtn icon={<span className={styles.codeIcon}>{'</>'}</span>} title="Code block (```)"
                             onClick={() => insertAround('```\n', '\n```')} />
                    <ToolBtn icon={<span className={styles.codeIcon}>`</span>} title="Inline code"
                             onClick={() => insertAround('`')} />
                    <div className={styles.toolSpacer} />
                    <span className={styles.toolHint}>Ctrl+S để lưu nhanh</span>
                </div>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    className={styles.editor}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onMouseUp={handleSelect}
                    onKeyUp={handleSelect}
                    placeholder="Nội dung fork của bạn..."
                    spellCheck={false}
                />
            </div>

            {/* ── AI panel (floating) ── */}
            {showAI && fork && (
                <AIPanel
                    templateId={fork.templateId}
                    selectedText={selectedText}
                    onClose={() => setShowAI(false)}
                />
            )}

            {/* ── Confirm reset dialog ── */}
            {confirmReset && (
                <div className={styles.dialogBackdrop}>
                    <div className={styles.dialog}>
                        <AlertTriangle size={22} color="#F59E0B" />
                        <h3 className={styles.dialogTitle}>Reset về nội dung gốc?</h3>
                        <p className={styles.dialogDesc}>
                            Toàn bộ chỉnh sửa của bạn sẽ bị xoá và thay bằng nội dung gốc từ admin.
                            Hành động này <strong>không thể hoàn tác</strong>.
                        </p>
                        <div className={styles.dialogBtns}>
                            <button
                                className={styles.dialogConfirm}
                                onClick={handleReset}
                                disabled={resetting}
                            >
                                {resetting ? 'Đang reset...' : 'Xác nhận reset'}
                            </button>
                            <button
                                className={styles.dialogCancel}
                                onClick={() => setConfirmReset(false)}
                            >
                                Huỷ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}