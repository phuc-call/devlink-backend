import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Heart, MessageCircle, CornerDownRight,
    Send, Loader2, AlertCircle, ChevronDown,
    MoreHorizontal, Pencil, Trash2, Flag, X, Check,
} from 'lucide-react';
import { getCurrentUserId } from '../../../utils/auth';
import { commentApi } from '../../../api/post-service/commentApi';
import type {
    CommentSummaryResponse,
    CommentReplySummaryResponse,
} from '../../../types/comment.types';



// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAvatar(name: string | null, avatarUrl: string | null): string {
    if (avatarUrl) return avatarUrl;
    const display = name || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}&background=3B82F6&color=fff&size=64`;
}

function timeAgo(iso: string): string {
    try {
        return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: vi });
    } catch {
        return '';
    }
}

// ─── REPORT REASONS ───────────────────────────────────────────────────────────
const REPORT_REASONS = [
    'Nội dung spam hoặc quảng cáo',
    'Ngôn ngữ thù địch, xúc phạm',
    'Thông tin sai lệch',
    'Vi phạm quyền riêng tư',
    'Nội dung không phù hợp khác',
];

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
    const [msg, setMsg] = useState('');
    const [type, setType] = useState<'success' | 'error'>('success');
    const timerRef = useRef<number | undefined>(undefined);

    const show = (message: string, t: 'success' | 'error' = 'success') => {
        clearTimeout(timerRef.current);
        setMsg(message);
        setType(t);
        timerRef.current = setTimeout(() => setMsg(''), 2800);
    };

    return { msg, type, show };
}

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────
interface DeleteModalProps {
    open: boolean;
    label: string;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}
function DeleteModal({ open, label, loading, onConfirm, onCancel }: DeleteModalProps) {
    if (!open) return null;
    return (
        <div
            onClick={(e) => e.target === e.currentTarget && onCancel()}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
        >
            <div style={{
                background: '#fff', borderRadius: 14, padding: '22px 24px',
                width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Trash2 size={18} color="#EF4444" />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Xác nhận xóa</span>
                </div>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 18 }}>
                    Bạn có chắc muốn xóa {label}? Hành động này không thể hoàn tác.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} disabled={loading} style={{
                        padding: '7px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
                        background: '#fff', fontSize: 13, cursor: 'pointer', color: '#6B7280',
                    }}>Huỷ</button>
                    <button onClick={onConfirm} disabled={loading} style={{
                        padding: '7px 16px', borderRadius: 8, border: 'none',
                        background: '#EF4444', color: '#fff', fontSize: 13,
                        fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.7 : 1,
                    }}>
                        {loading && <Loader2 size={13} style={{ animation: 'spin .8s linear infinite' }} />}
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── ReportModal ──────────────────────────────────────────────────────────────
interface ReportModalProps {
    open: boolean;
    targetName: string;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}
function ReportModal({ open, targetName, onClose, onSubmit }: ReportModalProps) {
    const [selected, setSelected] = useState('');
    if (!open) return null;
    return (
        <div
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
        >
            <div style={{
                background: '#fff', borderRadius: 14, padding: '22px 24px',
                width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Flag size={16} color="#EF4444" />
                        <span style={{ fontWeight: 600, fontSize: 15 }}>Tố cáo bình luận</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                        <X size={16} />
                    </button>
                </div>
                <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
                    Chọn lý do tố cáo bình luận của <strong>{targetName}</strong>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    {REPORT_REASONS.map((r) => (
                        <button
                            key={r}
                            onClick={() => setSelected(r)}
                            style={{
                                textAlign: 'left', border: selected === r ? '1.5px solid #3B82F6' : '1px solid #E5E7EB',
                                borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                                background: selected === r ? '#EFF6FF' : '#fff',
                                color: selected === r ? '#1D4ED8' : '#374151',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}
                        >
                            {selected === r && <Check size={13} color="#3B82F6" />}
                            {r}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{
                        padding: '7px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
                        background: '#fff', fontSize: 13, cursor: 'pointer', color: '#6B7280',
                    }}>Huỷ</button>
                    <button
                        disabled={!selected}
                        onClick={() => { onSubmit(selected); setSelected(''); }}
                        style={{
                            padding: '7px 16px', borderRadius: 8, border: 'none',
                            background: selected ? '#EF4444' : '#FCA5A5',
                            color: '#fff', fontSize: 13, fontWeight: 600,
                            cursor: selected ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Gửi tố cáo
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── MoreMenu ─────────────────────────────────────────────────────────────────
interface MoreMenuProps {
    isOwner: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onReport: () => void;
}
function MoreMenu({ isOwner, onEdit, onDelete, onReport }: MoreMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
            <button
                onClick={() => setOpen((v) => !v)}
                style={{
                    width: 28, height: 28, borderRadius: '50%', border: 'none',
                    background: open ? '#F3F4F6' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#9CA3AF', transition: 'background .15s',
                }}
                aria-label="Tùy chọn"
            >
                <MoreHorizontal size={16} />
            </button>

            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: '110%', zIndex: 200,
                    background: '#fff', borderRadius: 10,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    border: '1px solid #F3F4F6',
                    minWidth: 150, overflow: 'hidden',
                }}>
                    {isOwner ? (
                        <>
                            <button
                                onClick={() => { setOpen(false); onEdit(); }}
                                style={menuItemStyle('#111827')}
                            >
                                <Pencil size={14} color="#6B7280" /> Chỉnh sửa
                            </button>
                            <div style={{ height: 1, background: '#F3F4F6' }} />
                            <button
                                onClick={() => { setOpen(false); onDelete(); }}
                                style={menuItemStyle('#EF4444')}
                            >
                                <Trash2 size={14} color="#EF4444" /> Xóa
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => { setOpen(false); onReport(); }}
                            style={menuItemStyle('#EF4444')}
                        >
                            <Flag size={14} color="#EF4444" /> Tố cáo
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function menuItemStyle(color: string): React.CSSProperties {
    return {
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '9px 14px', border: 'none', background: 'none',
        fontSize: 13, cursor: 'pointer', color, fontFamily: 'inherit',
        transition: 'background .12s', textAlign: 'left',
    };
}

// ─── InlineEditInput ──────────────────────────────────────────────────────────
interface InlineEditProps {
    defaultValue: string;
    onSave: (content: string) => Promise<void>;
    onCancel: () => void;
    compact?: boolean;
}
function InlineEditInput({ defaultValue, onSave, onCancel, compact }: InlineEditProps) {
    const [value, setValue] = useState(defaultValue);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        ref.current?.focus();
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = ref.current.scrollHeight + 'px';
        }
    }, []);

    const handleSave = async () => {
        const trimmed = value.trim();
        if (!trimmed) { setError('Nội dung không được để trống'); return; }
        if (trimmed.length > 2000) { setError('Tối đa 2000 ký tự'); return; }
        setLoading(true);
        try {
            await onSave(trimmed);
        } catch {
            setError('Lưu thất bại. Thử lại sau.');
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{
                background: '#F3F4F6', borderRadius: 12, padding: '8px 12px',
                border: error ? '1.5px solid #EF4444' : '1.5px solid #3B82F6',
            }}>
                <textarea
                    ref={ref}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setError('');
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
                        if (e.key === 'Escape') onCancel();
                    }}
                    rows={1}
                    style={{
                        width: '100%', border: 'none', outline: 'none', resize: 'none',
                        background: 'transparent', fontSize: compact ? 13 : 14,
                        fontFamily: 'Inter, sans-serif', color: '#111827',
                        lineHeight: 1.5, overflow: 'hidden',
                    }}
                />
            </div>
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#EF4444', marginTop: 3 }}>
                    <AlertCircle size={11} />{error}
                </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 12px', borderRadius: 6, border: 'none',
                        background: loading ? '#93C5FD' : '#3B82F6',
                        color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    {loading
                        ? <Loader2 size={11} style={{ animation: 'spin .8s linear infinite' }} />
                        : <Check size={11} />}
                    Lưu
                </button>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB',
                        background: '#fff', fontSize: 12, cursor: 'pointer', color: '#6B7280',
                    }}
                >
                    Huỷ
                </button>
            </div>
        </div>
    );
}

// ─── CommentInput ─────────────────────────────────────────────────────────────
interface CommentInputProps {
    postId: number;
    commentId?: number;
    parentReplyId?: number | null;
    placeholder?: string;
    autoFocus?: boolean;
    onSuccess: (item: CommentSummaryResponse | CommentReplySummaryResponse) => void;
    onCancel?: () => void;
    compact?: boolean;
    isReplyMode?: boolean;
}

function CommentInput({
                          postId, commentId, parentReplyId = null,
                          placeholder = 'Viết bình luận...', autoFocus = false,
                          onSuccess, onCancel, compact = false, isReplyMode = false,
                      }: CommentInputProps) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (autoFocus) textareaRef.current?.focus();
    }, [autoFocus]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setError('');
        const el = e.target;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    const handleSubmit = async () => {
        const trimmed = content.trim();
        if (!trimmed) { setError('Nội dung không được để trống'); return; }
        if (trimmed.length > 2000) { setError('Tối đa 2000 ký tự'); return; }
        setLoading(true);
        setError('');
        try {
            if (isReplyMode && commentId) {
                const res = await commentApi.createReply({
                    postId, commentId,
                    parentReplyId: parentReplyId ?? null,
                    content: trimmed,
                });
                const created = res.data.data;
                const optimistic: CommentReplySummaryResponse = {
                    ...created, fullName: null, avatarUrl: null, type: 'REPLY',
                };
                onSuccess(optimistic);
            } else {
                const res = await commentApi.createComment({ postId, content: trimmed });
                const created = res.data.data;
                const optimistic: CommentSummaryResponse = {
                    id: created.id, postId: created.postId, authorId: created.authorId,
                    content: created.content, status: created.status, likeCount: 0,
                    createdAt: created.createdAt, fullName: null, avatarUrl: null, type: 'COMMENT',
                };
                onSuccess(optimistic);
            }
            setContent('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch {
            setError('Gửi thất bại, thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    };

    return (
        <div style={{ display: 'flex', gap: compact ? 8 : 10, alignItems: 'flex-start' }}>
            <img
                src={getAvatar(null, null)} alt="me"
                style={{
                    width: compact ? 28 : 32, height: compact ? 28 : 32,
                    borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 4,
                }}
            />
            <div style={{ flex: 1 }}>
                <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: 8,
                    background: '#F3F4F6', borderRadius: 20,
                    padding: '6px 10px 6px 14px',
                    border: error ? '1.5px solid #EF4444' : '1.5px solid transparent',
                }}>
                    <textarea
                        ref={textareaRef} value={content}
                        onChange={handleChange} onKeyDown={handleKeyDown}
                        placeholder={placeholder} rows={1}
                        style={{
                            flex: 1, border: 'none', outline: 'none', resize: 'none',
                            background: 'transparent', fontSize: compact ? 13 : 14,
                            fontFamily: 'Inter, sans-serif', color: '#111827',
                            lineHeight: 1.5, minHeight: 22, maxHeight: 120, overflow: 'auto', paddingTop: 2,
                        }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !content.trim()}
                        style={{
                            width: 30, height: 30, borderRadius: '50%', border: 'none',
                            background: (loading || !content.trim()) ? '#BFDBFE' : '#3B82F6',
                            cursor: (loading || !content.trim()) ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                    >
                        {loading
                            ? <Loader2 size={13} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} />
                            : <Send size={13} color="#fff" />}
                    </button>
                </div>
                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: '#EF4444' }}>
                        <AlertCircle size={12} />{error}
                    </div>
                )}
                {onCancel && (
                    <button onClick={onCancel} style={{ marginTop: 4, fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Huỷ
                    </button>
                )}
                <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, display: 'block' }}>
                    Enter để gửi · Shift+Enter xuống dòng
                </span>
            </div>
        </div>
    );
}

// ─── ReplyItem ────────────────────────────────────────────────────────────────
interface ReplyItemProps {
    reply: CommentReplySummaryResponse;
    postId: number;
    commentId: number;
    currentUserId: number | null;
    onReplySuccess: (reply: CommentReplySummaryResponse) => void;
    onDeleteSuccess: (replyId: number) => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}

function ReplyItem({ reply, postId, commentId, currentUserId, onReplySuccess, onDeleteSuccess, showToast }: ReplyItemProps) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(reply.likeCount ?? 0);
    const [editing, setEditing] = useState(false);
    const [content, setContent] = useState(reply.content);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleted, setDeleted] = useState(false);

    const isOwner = currentUserId !== null && reply.authorId === currentUserId;

    if (deleted) return null;

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await commentApi.deleteComment(reply.id, 'REPLY');
            setShowDeleteModal(false);
            setDeleted(true);
            onDeleteSuccess(reply.id);
            showToast('Đã xóa phản hồi.');
        } catch {
            showToast('Xóa thất bại. Thử lại sau.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleSaveEdit = async (newContent: string) => {
        await commentApi.updateComment(reply.id, { type: 'REPLY', content: newContent });
        setContent(newContent);
        setEditing(false);
        showToast('Đã lưu thay đổi.');
    };

    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <img
                src={getAvatar(reply.fullName, reply.avatarUrl)}
                alt={reply.fullName ?? 'User'}
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                {editing ? (
                    <InlineEditInput
                        defaultValue={content}
                        onSave={handleSaveEdit}
                        onCancel={() => setEditing(false)}
                        compact
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <div style={{
                            background: '#F3F4F6', borderRadius: 12, padding: '6px 10px',
                            flex: 1, minWidth: 0, wordBreak: 'break-word',
                        }}>
                            <span style={{ fontWeight: 600, fontSize: 12, color: '#111827', display: 'block', marginBottom: 2 }}>
                                {reply.fullName || 'Người dùng'}
                            </span>
                            <p style={{ margin: 0, fontSize: 13, color: '#111827', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                {content}
                            </p>
                        </div>
                        <MoreMenu
                            isOwner={isOwner}
                            onEdit={() => setEditing(true)}
                            onDelete={() => setShowDeleteModal(true)}
                            onReport={() => setShowReportModal(true)}
                        />
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, paddingLeft: 4 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timeAgo(reply.createdAt)}</span>
                    <button
                        onClick={() => { setLiked((v) => !v); setLikeCount((c) => liked ? c - 1 : c + 1); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: liked ? '#EF4444' : '#6B7280', padding: 0 }}
                    >
                        <Heart size={13} fill={liked ? '#EF4444' : 'none'} />
                        {likeCount > 0 ? likeCount : 'Thích'}
                    </button>
                    <button
                        onClick={() => setShowReplyInput((v) => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: showReplyInput ? '#3B82F6' : '#6B7280', padding: 0 }}
                    >
                        <MessageCircle size={13} />Phản hồi
                    </button>
                </div>

                {showReplyInput && (
                    <div style={{ marginTop: 8 }}>
                        <CommentInput
                            postId={postId} commentId={commentId}
                            parentReplyId={reply.id}
                            placeholder={`Phản hồi ${reply.fullName ?? 'người dùng'}...`}
                            autoFocus compact isReplyMode
                            onSuccess={(r) => { onReplySuccess(r as CommentReplySummaryResponse); setShowReplyInput(false); }}
                            onCancel={() => setShowReplyInput(false)}
                        />
                    </div>
                )}

                <DeleteModal
                    open={showDeleteModal}
                    label="phản hồi này"
                    loading={deleting}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />
                <ReportModal
                    open={showReportModal}
                    targetName={reply.fullName ?? 'người dùng'}
                    onClose={() => setShowReportModal(false)}
                    onSubmit={() => { setShowReportModal(false); showToast('Đã gửi tố cáo. Cảm ơn bạn!'); }}
                />
            </div>
        </div>
    );
}

// ─── CommentItem ──────────────────────────────────────────────────────────────
interface CommentItemProps {
    comment: CommentSummaryResponse;
    postId: number;
    currentUserId: number | null;
    onReplySuccess: (reply: CommentReplySummaryResponse) => void;
    onDeleteSuccess: (commentId: number) => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}

function CommentItem({ comment, postId, currentUserId, onReplySuccess, onDeleteSuccess, showToast }: CommentItemProps) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.likeCount ?? 0);
    const [replies, setReplies] = useState<CommentReplySummaryResponse[]>([]);
    const [replyPage, setReplyPage] = useState(0);
    const [hasMoreReplies, setHasMoreReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [repliesLoaded, setRepliesLoaded] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [editing, setEditing] = useState(false);
    const [content, setContent] = useState(comment.content);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleted, setDeleted] = useState(false);

    const isOwner = currentUserId !== null && comment.authorId === currentUserId;

    if (deleted) return null;

    const loadReplies = async (page: number) => {
        setLoadingReplies(true);
        try {
            const res = await commentApi.getReplies(comment.id, page);
            const pageData = res.data.data;
            setReplies((prev) => page === 0 ? pageData.content : [...prev, ...pageData.content]);
            setHasMoreReplies(!pageData.last);
            setReplyPage(page);
            setRepliesLoaded(true);
        } catch {
            // ignore
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleShowReplies = () => {
        if (!repliesLoaded) loadReplies(0);
        setShowReplies((v) => !v);
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await commentApi.deleteComment(comment.id, 'COMMENT');
            setShowDeleteModal(false);
            setDeleted(true);
            onDeleteSuccess(comment.id);
            showToast('Đã xóa bình luận.');
        } catch {
            showToast('Xóa thất bại. Thử lại sau.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleSaveEdit = async (newContent: string) => {
        await commentApi.updateComment(comment.id, { type: 'COMMENT', content: newContent });
        setContent(newContent);
        setEditing(false);
        showToast('Đã lưu thay đổi.');
    };

    const handleReplySuccess = (reply: CommentReplySummaryResponse) => {
        setReplies((prev) => [...prev, reply]);
        onReplySuccess(reply);
        setShowReplyInput(false);
        setRepliesLoaded(true);
        setShowReplies(true);
    };

    const handleReplyDeleted = (replyId: number) => {
        setReplies((prev) => prev.filter((r) => r.id !== replyId));
    };

    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <img
                src={getAvatar(comment.fullName, comment.avatarUrl)}
                alt={comment.fullName ?? 'User'}
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Bubble hoặc inline edit */}
                {editing ? (
                    <InlineEditInput
                        defaultValue={content}
                        onSave={handleSaveEdit}
                        onCancel={() => setEditing(false)}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <div style={{
                            background: '#F3F4F6', borderRadius: 12, padding: '8px 12px',
                            flex: 1, minWidth: 0, wordBreak: 'break-word',
                        }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#111827', display: 'block', marginBottom: 2 }}>
                                {comment.fullName || 'Người dùng'}
                            </span>
                            <p style={{ margin: 0, fontSize: 14, color: '#111827', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                {content}
                            </p>
                        </div>
                        <MoreMenu
                            isOwner={isOwner}
                            onEdit={() => setEditing(true)}
                            onDelete={() => setShowDeleteModal(true)}
                            onReport={() => setShowReportModal(true)}
                        />
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, paddingLeft: 4 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timeAgo(comment.createdAt)}</span>
                    <button
                        onClick={() => { setLiked((v) => !v); setLikeCount((c) => liked ? c - 1 : c + 1); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: liked ? '#EF4444' : '#6B7280', padding: 0 }}
                    >
                        <Heart size={13} fill={liked ? '#EF4444' : 'none'} />
                        {likeCount > 0 ? likeCount : 'Thích'}
                    </button>
                    <button
                        onClick={() => setShowReplyInput((v) => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: showReplyInput ? '#3B82F6' : '#6B7280', padding: 0 }}
                    >
                        <MessageCircle size={13} />Phản hồi
                    </button>
                </div>

                {/* Reply input */}
                {showReplyInput && (
                    <div style={{ marginTop: 8 }}>
                        <CommentInput
                            postId={postId} commentId={comment.id}
                            placeholder={`Phản hồi ${comment.fullName ?? 'người dùng'}...`}
                            autoFocus compact isReplyMode
                            onSuccess={(r) => handleReplySuccess(r as CommentReplySummaryResponse)}
                            onCancel={() => setShowReplyInput(false)}
                        />
                    </div>
                )}

                {/* Nút xem/ẩn replies */}
                {(!repliesLoaded || replies.length > 0) && (
                    <button
                        onClick={handleShowReplies}
                        style={{
                            marginTop: 6, fontSize: 12, color: '#3B82F6',
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}
                    >
                        <CornerDownRight size={11} />
                        {showReplies ? 'Ẩn phản hồi' : (repliesLoaded ? `Xem ${replies.length} phản hồi` : 'Xem phản hồi')}
                    </button>
                )}

                {/* Replies list */}
                {showReplies && replies.length > 0 && (
                    <div style={{
                        marginTop: 10, marginLeft: 8, paddingLeft: 12,
                        borderLeft: '2px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                        {replies.map((reply) => (
                            <div key={reply.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <CornerDownRight size={11} color="#D1D5DB" style={{ marginTop: 8, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <ReplyItem
                                        reply={reply}
                                        postId={postId}
                                        commentId={comment.id}
                                        currentUserId={currentUserId}
                                        onReplySuccess={handleReplySuccess}
                                        onDeleteSuccess={handleReplyDeleted}
                                        showToast={showToast}
                                    />
                                </div>
                            </div>
                        ))}
                        {hasMoreReplies && (
                            <button
                                onClick={() => loadReplies(replyPage + 1)}
                                disabled={loadingReplies}
                                style={{ fontSize: 12, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}
                            >
                                {loadingReplies ? 'Đang tải...' : 'Xem thêm phản hồi'}
                            </button>
                        )}
                    </div>
                )}

                {loadingReplies && !showReplies && (
                    <div style={{ marginTop: 6 }}>
                        <Loader2 size={14} color="#3B82F6" style={{ animation: 'spin .8s linear infinite' }} />
                    </div>
                )}

                <DeleteModal
                    open={showDeleteModal}
                    label="bình luận này (bao gồm tất cả phản hồi)"
                    loading={deleting}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />
                <ReportModal
                    open={showReportModal}
                    targetName={comment.fullName ?? 'người dùng'}
                    onClose={() => setShowReportModal(false)}
                    onSubmit={() => { setShowReportModal(false); showToast('Đã gửi tố cáo. Cảm ơn bạn!'); }}
                />
            </div>
        </div>
    );
}

// ─── CommentSection ───────────────────────────────────────────────────────────
interface Props {
    postId: number;
    commentCount?: number;
    defaultOpen?: boolean;
}

export default function CommentSection({ postId, commentCount, defaultOpen }: Props) {
    const [open, setOpen] = useState(defaultOpen ?? false);
    const [comments, setComments] = useState<CommentSummaryResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [error, setError] = useState('');
    const [currentUserId] = useState<number | null>(() => getCurrentUserId());
    const toast = useToast();

    // Scrollable container ref for infinite scroll
    const scrollRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const loadComments = useCallback(async (pageNum: number) => {
        if (loading) return;
        setLoading(true);
        setError('');
        try {
            const res = await commentApi.getComments(postId, pageNum);
            const pageData = res.data.data;
            setComments((prev) => pageNum === 0 ? pageData.content : [...prev, ...pageData.content]);
            setHasMore(!pageData.last);
            setPage(pageNum);
        } catch {
            setError('Không thể tải bình luận. Thử lại sau.');
        } finally {
            setLoading(false);
            setInitialLoaded(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId]);

    const handleToggle = () => {
        if (!open && !initialLoaded) loadComments(0);
        setOpen((v) => !v);
    };

    // Infinite scroll bên trong scrollable div
    useEffect(() => {
        if (!open || !hasMore || loading || !initialLoaded) return;
        observerRef.current?.disconnect();
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadComments(page + 1);
            },
            { root: scrollRef.current, threshold: 0.5 }
        );
        if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
        return () => observerRef.current?.disconnect();
    }, [open, hasMore, loading, page, loadComments, initialLoaded]);

    const handleNewComment = (comment: CommentSummaryResponse) => {
        setComments((prev) => [comment, ...prev]);
    };

    const handleCommentDeleted = (commentId: number) => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
    };

    return (
        <div style={{ fontFamily: 'Inter, sans-serif', borderTop: '1px solid #F3F4F6' }}>
            {/* ── Toggle button ── */}
            <button
                onClick={handleToggle}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, color: '#6B7280',
                    padding: '10px 16px', width: '100%', textAlign: 'left',
                }}
            >
                <MessageCircle size={14} />
                Bình luận{commentCount != null && commentCount > 0 ? ` (${commentCount})` : ''}
                <ChevronDown
                    size={13}
                    style={{
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s', marginLeft: 2,
                    }}
                />
            </button>

            {/* ── Dropdown panel với thanh cuộn ── */}
            {open && (
                <div style={{ borderTop: '1px solid #F3F4F6' }}>
                    {/* Input luôn cố định ở trên */}
                    <div style={{ padding: '14px 16px 10px' }}>
                        <CommentInput
                            postId={postId}
                            onSuccess={(c) => handleNewComment(c as CommentSummaryResponse)}
                        />
                    </div>

                    {/* Scrollable comment list – max-height + overflow */}
                    <div
                        ref={scrollRef}
                        style={{
                            maxHeight: 480,
                            overflowY: 'auto',
                            padding: '0 16px 14px',
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#E5E7EB transparent',
                        }}
                    >
                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '10px 12px', borderRadius: 8,
                                background: '#FEF2F2', color: '#EF4444', fontSize: 13, marginBottom: 10,
                            }}>
                                <AlertCircle size={14} />{error}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {comments.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    postId={postId}
                                    currentUserId={currentUserId}
                                    onReplySuccess={() => {}}
                                    onDeleteSuccess={handleCommentDeleted}
                                    showToast={toast.show}
                                />
                            ))}
                        </div>

                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                                <Loader2 size={20} color="#3B82F6" style={{ animation: 'spin 0.8s linear infinite' }} />
                            </div>
                        )}

                        {hasMore && !loading && <div ref={sentinelRef} style={{ height: 1 }} />}

                        {!hasMore && comments.length > 0 && (
                            <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', margin: '10px 0 0', paddingBottom: 4 }}>
                                Đã hiển thị tất cả bình luận
                            </p>
                        )}

                        {!loading && initialLoaded && comments.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <MessageCircle size={28} color="#D1D5DB" style={{ margin: '0 auto 8px' }} />
                                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                                    Chưa có bình luận nào. Hãy là người đầu tiên!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Toast notification ── */}
            {toast.msg && (
                <div style={{
                    position: 'fixed', bottom: 24, left: '50%',
                    transform: 'translateX(-50%)',
                    background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5',
                    color: toast.type === 'error' ? '#DC2626' : '#065F46',
                    border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#6EE7B7'}`,
                    padding: '9px 20px', borderRadius: 99,
                    fontSize: 13, fontWeight: 500, zIndex: 2000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    animation: 'fadeInUp .2s ease',
                }}>
                    {toast.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
                    {toast.msg}
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
            `}</style>
        </div>
    );
}