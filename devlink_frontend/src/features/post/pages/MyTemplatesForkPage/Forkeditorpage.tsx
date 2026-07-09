import {useEffect, useState, useRef, useCallback} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
    ArrowLeft, Save, RotateCcw, Sparkles, Download,
    MessageSquare, Bold, Italic, Underline, List,
    AlignLeft, AlignCenter, AlignRight, ChevronDown,
    ChevronUp, X, Send, Loader2, AlertTriangle,
    CheckCircle, FileText, Clock, Hash, XCircle,
} from 'lucide-react';
import styles from './ForkEditorPage.module.css';
import SuggestionModal from '../../../post/components/Suggestionmodal.tsx';
import axiosInstance from '../../../../api/axiosInstance';
import {askAboutTemplate} from '../../../../api/post-service/learningTemplateApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ForkDetail {
    id: number;
    templateId: number;
    title: string;
    content: string | null;
    fileUrl: string | null;
    isModified: boolean;
    proposed: boolean;           // true = đã gửi đề xuất, false = chưa gửi
    suggestionId: number | null; // id suggestion đang active (PENDING/REVIEWING)
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
    const res = await axiosInstance.get(`/api/templates/forks/${forkId}`);
    return res.data;
};

const updateFork = async (forkId: number, content: string, title?: string): Promise<ForkResponse> => {
    const res = await axiosInstance.patch(`/api/templates/forks/${forkId}`, {content, title});
    return res.data;
};

const resetFork = async (forkId: number): Promise<ForkResponse> => {
    const res = await axiosInstance.put(`/api/templates/forks/${forkId}/reset`);
    return res.data;
};



// PUT /api/templates/suggestions/{suggestionId}/cancel
const cancelSuggestionApi = async (suggestionId: number): Promise<void> => {
    await axiosInstance.put(`/api/templates/suggestions/${suggestionId}/cancel`);
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

function ToolBtn({icon, title, onClick}: { icon: React.ReactNode; title: string; onClick: () => void }) {
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

function AIPanel({templateId, selectedText, onClose}: AIPanelProps) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState(false);

    const handleAsk = async () => {
        if (!question.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await askAboutTemplate(templateId, {
                question,
                contextCode: selectedText || undefined,
            });
            setAnswer(res.answer ?? 'Không có phản hồi.');
        } catch {
            setError('AI tạm thời không khả dụng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${styles.aiPanel} ${collapsed ? styles.aiPanelCollapsed : ''}`}>
            <div className={styles.aiHeader}>
                <div className={styles.aiTitle}>
                    <Sparkles size={15} color="#8B5CF6"/>
                    <span>Hỏi OpenAI</span>
                </div>
                <div className={styles.aiHeaderActions}>
                    <button className={styles.aiToggleBtn} onClick={() => setCollapsed(v => !v)}
                            title={collapsed ? 'Mở rộng' : 'Thu nhỏ'}>
                        {collapsed ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                    <button className={styles.aiCloseBtn} onClick={onClose} title="Đóng"><X size={14}/></button>
                </div>
            </div>
            {!collapsed && (
                <div className={styles.aiBody}>
                    {selectedText && (
                        <div className={styles.contextBox}>
                            <span className={styles.contextLabel}>Đoạn được chọn:</span>
                            <p className={styles.contextText}>{selectedText.slice(0, 200)}{selectedText.length > 200 ? '...' : ''}</p>
                        </div>
                    )}
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
                            <button className={styles.askBtn} onClick={handleAsk}
                                    disabled={loading || !question.trim()}>
                                {loading ? <Loader2 size={13} className={styles.spin}/> : <Send size={13}/>}
                                {loading ? 'Đang hỏi...' : 'Hỏi AI'}
                            </button>
                        </div>
                    </div>
                    {error && <div className={styles.aiError}><AlertTriangle size={13}/> {error}</div>}
                    {answer && (
                        <div className={styles.answerBox}>
                            <div className={styles.answerLabel}><Sparkles size={12}/> OpenAI trả lời:</div>
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
    const {forkId} = useParams<{ forkId: string }>();
    const navigate = useNavigate();

    const [fork, setFork] = useState<ForkDetail | null>(null);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showSuggestion, setShowSuggestion] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [cancelSuccess, setCancelSuccess] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [selectedText, setSelectedText] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    const handleSelect = useCallback(() => {
        const sel = window.getSelection()?.toString() ?? '';
        if (sel.trim()) setSelectedText(sel);
    }, []);

    const insertAround = (before: string, after: string = before) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart, end = ta.selectionEnd;
        const sel = content.slice(start, end);
        setContent(content.slice(0, start) + before + sel + after + content.slice(end));
        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const insertLine = (prefix: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        setContent(content.slice(0, lineStart) + prefix + content.slice(lineStart));
        setTimeout(() => ta.focus(), 0);
    };

    const handleSave = async () => {
        if (!forkId) return;
        setSaving(true);
        try {
            const updated = await updateFork(Number(forkId), content, title);
            setFork(prev => prev ? {...prev, isModified: updated.isModified, title: updated.title} : prev);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch {
            alert('Lưu thất bại. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!forkId) return;
        setResetting(true);
        try {
            await resetFork(Number(forkId));
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

    // ── Thu hồi đề xuất ───────────────────────────────────────────────────────
    const handleCancelSuggestion = async () => {
        if (!fork?.suggestionId) return;
        setCancelling(true);
        try {
            await cancelSuggestionApi(fork.suggestionId);
            setFork(prev => prev ? {...prev, proposed: false, suggestionId: null} : prev);
            setConfirmCancel(false);
            setCancelSuccess(true);
            setTimeout(() => setCancelSuccess(false), 2500);
        } catch {
            alert('Thu hồi đề xuất thất bại. Vui lòng thử lại.');
        } finally {
            setCancelling(false);
        }
    };

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

    if (loading) return (
        <div className={styles.loadingPage}><Loader2 size={32}
                                                     className={styles.spin}/><span>Đang tải nội dung...</span></div>
    );
    if (error) return (
        <div className={styles.errorPage}>
            <AlertTriangle size={28} color="#EF4444"/><p>{error}</p>
            <button className={styles.retryBtn} onClick={() => navigate(-1)}>Quay lại</button>
        </div>
    );

    return (
        <div className={styles.page}>

            {/* ── Top bar ── */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}><ArrowLeft size={16}/> Quay lại
                    </button>
                    <div className={styles.titleWrap}>
                        <input className={styles.titleInput} value={title} onChange={e => setTitle(e.target.value)}
                               placeholder="Tiêu đề fork..."/>
                        {fork?.isModified && <span className={styles.modifiedDot} title="Đã chỉnh sửa"/>}
                    </div>
                </div>

                <div className={styles.topRight}>

                    {/* Thu hồi đề xuất — chỉ hiện khi proposed = true */}
                    {fork?.proposed && fork.suggestionId && (
                        <button
                            className={`${styles.topBtn} ${styles.btnWarning}`}
                            title="Thu hồi đề xuất đã gửi"
                            onClick={() => setConfirmCancel(true)}
                            disabled={cancelling}
                        >
                            {cancelling ? <Loader2 size={14} className={styles.spin}/> : <XCircle size={14}/>}
                            {cancelling ? 'Đang thu hồi...' : 'Thu hồi đề xuất'}
                        </button>
                    )}

                    {/* Badge thu hồi thành công */}
                    {cancelSuccess && (
                        <span className={styles.cancelSuccessBadge}>
                            <CheckCircle size={13}/> Đã thu hồi
                        </span>
                    )}

                    {/* Badge đang chờ duyệt */}
                    {fork?.proposed && !cancelling && !cancelSuccess && (
                        <span className={styles.proposedBadge}>
                            <Clock size={12}/> Đang chờ duyệt
                        </span>
                    )}

                    {/* Đề xuất sửa — ẩn khi đã proposed */}
                    {!fork?.proposed && (
                        <button
                            className={`${styles.topBtn} ${styles.btnGhost}`}
                            title="Đề xuất sửa"
                            onClick={() => setShowSuggestion(true)}
                            disabled={!fork}
                        >
                            <MessageSquare size={14}/> Đề xuất sửa
                        </button>
                    )}

                    <button className={`${styles.topBtn} ${styles.btnGhost}`} title="Tải xuống">
                        <Download size={14}/> Tải xuống
                    </button>

                    <button
                        className={`${styles.topBtn} ${styles.btnAI} ${showAI ? styles.btnAIActive : ''}`}
                        onClick={() => setShowAI(v => !v)}
                        title="Hỏi OpenAI"
                    >
                        <Sparkles size={14}/> OpenAI
                    </button>

                    <button className={`${styles.topBtn} ${styles.btnDanger}`} onClick={() => setConfirmReset(true)}
                            disabled={resetting} title="Reset fork">
                        <RotateCcw size={14}/> Reset
                    </button>

                    <button
                        className={`${styles.topBtn} ${styles.btnSave} ${saveSuccess ? styles.btnSaved : ''}`}
                        onClick={handleSave}
                        disabled={saving}
                        title="Lưu (Ctrl+S)"
                    >
                        {saving ? <Loader2 size={14} className={styles.spin}/> : saveSuccess ?
                            <CheckCircle size={14}/> : <Save size={14}/>}
                        {saving ? 'Đang lưu...' : saveSuccess ? 'Đã lưu!' : 'Lưu'}
                    </button>
                </div>
            </div>

            {/* ── Meta strip ── */}
            <div className={styles.metaStrip}>
                <span><FileText size={12}/> fork #{fork?.id}</span>
                <span><Hash size={12}/> template #{fork?.templateId}</span>
                <span><Clock size={12}/> Sửa lần cuối: {formatDate(fork?.lastEditedAt ?? null)}</span>
                <span className={styles.wordCount}>{wordCount(content)} từ · {content.length} ký tự</span>
            </div>

            {/* ── Editor area ── */}
            <div className={styles.editorWrap}>
                <div className={styles.toolbar}>
                    <ToolBtn icon={<Bold size={14}/>} title="In đậm (**text**)" onClick={() => insertAround('**')}/>
                    <ToolBtn icon={<Italic size={14}/>} title="In nghiêng (*text*)" onClick={() => insertAround('*')}/>
                    <ToolBtn icon={<Underline size={14}/>} title="Gạch chân (__text__)"
                             onClick={() => insertAround('__')}/>
                    <div className={styles.toolDivider}/>
                    <ToolBtn icon={<List size={14}/>} title="Danh sách (- item)" onClick={() => insertLine('- ')}/>
                    <ToolBtn icon={<AlignLeft size={14}/>} title="Tiêu đề (# )" onClick={() => insertLine('# ')}/>
                    <ToolBtn icon={<AlignCenter size={14}/>} title="Tiêu đề 2 (## )" onClick={() => insertLine('## ')}/>
                    <ToolBtn icon={<AlignRight size={14}/>} title="Tiêu đề 3 (### )"
                             onClick={() => insertLine('### ')}/>
                    <div className={styles.toolDivider}/>
                    <ToolBtn icon={<span className={styles.codeIcon}>{'</>'}</span>} title="Code block (```)"
                             onClick={() => insertAround('```\n', '\n```')}/>
                    <ToolBtn icon={<span className={styles.codeIcon}>`</span>} title="Inline code"
                             onClick={() => insertAround('`')}/>
                    <div className={styles.toolSpacer}/>
                    <span className={styles.toolHint}>Ctrl+S để lưu nhanh</span>
                </div>
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

            {showAI && fork && (
                <AIPanel templateId={fork.templateId} selectedText={selectedText} onClose={() => setShowAI(false)}/>
            )}

            {/* ── Confirm reset ── */}
            {confirmReset && (
                <div className={styles.dialogBackdrop}>
                    <div className={styles.dialog}>
                        <AlertTriangle size={22} color="#F59E0B"/>
                        <h3 className={styles.dialogTitle}>Reset về nội dung gốc?</h3>
                        <p className={styles.dialogDesc}>
                            Toàn bộ chỉnh sửa của bạn sẽ bị xoá và thay bằng nội dung gốc từ admin.
                            Hành động này <strong>không thể hoàn tác</strong>.
                        </p>
                        <div className={styles.dialogBtns}>
                            <button className={styles.dialogConfirm} onClick={handleReset} disabled={resetting}>
                                {resetting ? 'Đang reset...' : 'Xác nhận reset'}
                            </button>
                            <button className={styles.dialogCancel} onClick={() => setConfirmReset(false)}>Huỷ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm cancel suggestion ── */}
            {confirmCancel && (
                <div className={styles.dialogBackdrop}>
                    <div className={styles.dialog}>
                        <XCircle size={22} color="#EF4444"/>
                        <h3 className={styles.dialogTitle}>Thu hồi đề xuất?</h3>
                        <p className={styles.dialogDesc}>
                            Đề xuất của bạn sẽ bị <strong>xoá hoàn toàn</strong> và không thể khôi phục.
                            Bạn có thể gửi lại đề xuất mới sau khi thu hồi.
                        </p>
                        <div className={styles.dialogBtns}>
                            <button
                                className={styles.dialogConfirm}
                                style={{background: '#EF4444'}}
                                onClick={handleCancelSuggestion}
                                disabled={cancelling}
                            >
                                {cancelling ? 'Đang thu hồi...' : 'Xác nhận thu hồi'}
                            </button>
                            <button className={styles.dialogCancel} onClick={() => setConfirmCancel(false)}>Huỷ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Suggestion modal ── */}
            {showSuggestion && fork && (
                <SuggestionModal
                    templateId={fork.templateId}
                    forkId={fork.id}
                    onClose={() => setShowSuggestion(false)}
                    onSuccess={() => {
                        setShowSuggestion(false);
                        void getForkDetail(Number(forkId)).then(data => setFork(data));
                    }}
                />
            )}
        </div>
    );
}