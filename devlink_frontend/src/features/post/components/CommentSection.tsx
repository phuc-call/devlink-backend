import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Heart, MessageCircle, CornerDownRight,
    Send, Loader2, AlertCircle, ChevronDown,
} from 'lucide-react';
import { commentApi } from '../../../api/post-service/commentApi';
import type {
    CommentSummaryResponse,
    CommentReplySummaryResponse,
} from '../../../types/comment.types';

interface Props {
    postId: number;
    commentCount?: number;
    defaultOpen?: boolean;
}

function getAvatar(name: string | null, avatarUrl: string | null): string {
    if (avatarUrl) return avatarUrl;
    const display = name || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}&background=3B82F6&color=fff&size=64`;
}

function timeAgo(iso: string): string {
    try {
        return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: vi });
    } catch { return ''; }
}

// ── CommentInput ──
interface CommentInputProps {
    postId: number;
    commentId?: number;         // nếu có → reply vào reply
    parentReplyId?: number | null;
    placeholder?: string;
    autoFocus?: boolean;
    onSuccess: (item: CommentSummaryResponse | CommentReplySummaryResponse) => void;
    onCancel?: () => void;
    compact?: boolean;
    isReplyMode?: boolean;      // true → gọi createReply
}

function CommentInput({
                          postId, commentId, parentReplyId = null,
                          placeholder = 'Viết bình luận...',
                          autoFocus = false, onSuccess, onCancel,
                          compact = false, isReplyMode = false,
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
                // Gọi API reply
                const res = await commentApi.createReply({
                    postId,
                    commentId,
                    parentReplyId: parentReplyId ?? null,
                    content: trimmed,
                });
                const created = res.data.data;
                const optimistic: CommentReplySummaryResponse = {
                    ...created,
                    fullName: null,
                    avatarUrl: null,
                    type: 'REPLY',
                };
                onSuccess(optimistic);
            } else {
                // Gọi API comment
                const res = await commentApi.createComment({ postId, content: trimmed });
                const created = res.data.data;
                const optimistic: CommentSummaryResponse = {
                    id: created.id,
                    postId: created.postId,
                    authorId: created.authorId,
                    content: created.content,
                    status: created.status,
                    likeCount: 0,
                    createdAt: created.createdAt,
                    fullName: null,
                    avatarUrl: null,
                    type: 'COMMENT',
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
                style={{ width: compact ? 28 : 32, height: compact ? 28 : 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 4 }}
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
                        onClick={handleSubmit} disabled={loading || !content.trim()}
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

// ── CommentItem ──
interface CommentItemProps {
    comment: CommentSummaryResponse;
    postId: number;
    onReplySuccess: (reply: CommentReplySummaryResponse) => void;
}

function CommentItem({ comment, postId, onReplySuccess }: CommentItemProps) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.likeCount ?? 0);
    const [replies, setReplies] = useState<CommentReplySummaryResponse[]>([]);
    const [replyPage, setReplyPage] = useState(0);
    const [hasMoreReplies, setHasMoreReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [repliesLoaded, setRepliesLoaded] = useState(false);

    const loadReplies = async (page: number) => {
        setLoadingReplies(true);
        try {
            const res = await commentApi.getReplies(comment.id, page);
            const pageData = res.data.data;
            setReplies(prev => page === 0 ? pageData.content : [...prev, ...pageData.content]);
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
    };

    const handleLike = () => {
        setLiked(v => !v);
        setLikeCount(c => liked ? c - 1 : c + 1);
    };

    const handleReplySuccess = (reply: CommentReplySummaryResponse) => {
        setReplies(prev => [...prev, reply]);
        onReplySuccess(reply);
        setShowReplyInput(false);
        setRepliesLoaded(true);
    };

    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <img
                src={getAvatar(comment.fullName, comment.avatarUrl)}
                alt={comment.fullName ?? 'User'}
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Bubble */}
                <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '8px 12px', display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#111827', display: 'block', marginBottom: 2 }}>
                        {comment.fullName || 'Người dùng'}
                    </span>
                    <p style={{ margin: 0, fontSize: 14, color: '#111827', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                    </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, paddingLeft: 4 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timeAgo(comment.createdAt)}</span>
                    <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: liked ? '#EF4444' : '#6B7280', padding: 0 }}>
                        <Heart size={13} fill={liked ? '#EF4444' : 'none'} />
                        {likeCount > 0 ? likeCount : 'Thích'}
                    </button>
                    <button onClick={() => setShowReplyInput(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: showReplyInput ? '#3B82F6' : '#6B7280', padding: 0 }}>
                        <MessageCircle size={13} />
                        Phản hồi
                    </button>
                </div>

                {/* Reply input */}
                {showReplyInput && (
                    <div style={{ marginTop: 8 }}>
                        <CommentInput
                            postId={postId}
                            commentId={comment.id}
                            placeholder={`Phản hồi ${comment.fullName ?? 'người dùng'}...`}
                            autoFocus compact isReplyMode
                            onSuccess={(r) => handleReplySuccess(r as CommentReplySummaryResponse)}
                            onCancel={() => setShowReplyInput(false)}
                        />
                    </div>
                )}

                {/* Xem replies */}
                {!repliesLoaded && (
                    <button onClick={handleShowReplies} style={{ marginTop: 6, fontSize: 12, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Xem phản hồi
                    </button>
                )}

                {/* Danh sách replies */}
                {replies.length > 0 && (
                    <div style={{ marginTop: 10, marginLeft: 8, paddingLeft: 12, borderLeft: '2px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {replies.map(reply => (
                            <div key={reply.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <CornerDownRight size={12} color="#9CA3AF" style={{ marginTop: 8, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <ReplyItem reply={reply} postId={postId} commentId={comment.id} onReplySuccess={handleReplySuccess} />
                                </div>
                            </div>
                        ))}
                        {/* Load more replies */}
                        {hasMoreReplies && (
                            <button onClick={() => loadReplies(replyPage + 1)} disabled={loadingReplies}
                                    style={{ fontSize: 12, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}>
                                {loadingReplies ? 'Đang tải...' : 'Xem thêm phản hồi'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── ReplyItem ──
interface ReplyItemProps {
    reply: CommentReplySummaryResponse;
    postId: number;
    commentId: number;
    onReplySuccess: (reply: CommentReplySummaryResponse) => void;
}

function ReplyItem({ reply, postId, commentId, onReplySuccess }: ReplyItemProps) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(reply.likeCount ?? 0);

    const handleLike = () => {
        setLiked(v => !v);
        setLikeCount(c => liked ? c - 1 : c + 1);
    };

    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <img
                src={getAvatar(reply.fullName, reply.avatarUrl)}
                alt={reply.fullName ?? 'User'}
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '6px 10px', display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word' }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: '#111827', display: 'block', marginBottom: 2 }}>
                        {reply.fullName || 'Người dùng'}
                    </span>
                    <p style={{ margin: 0, fontSize: 13, color: '#111827', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {reply.content}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, paddingLeft: 4 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timeAgo(reply.createdAt)}</span>
                    <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: liked ? '#EF4444' : '#6B7280', padding: 0 }}>
                        <Heart size={13} fill={liked ? '#EF4444' : 'none'} />
                        {likeCount > 0 ? likeCount : 'Thích'}
                    </button>
                    <button onClick={() => setShowReplyInput(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: showReplyInput ? '#3B82F6' : '#6B7280', padding: 0 }}>
                        <MessageCircle size={13} />
                        Phản hồi
                    </button>
                </div>
                {showReplyInput && (
                    <div style={{ marginTop: 8 }}>
                        <CommentInput
                            postId={postId}
                            commentId={commentId}
                            parentReplyId={reply.id}
                            placeholder={`Phản hồi ${reply.fullName ?? 'người dùng'}...`}
                            autoFocus compact isReplyMode
                            onSuccess={(r) => {
                                onReplySuccess(r as CommentReplySummaryResponse);
                                setShowReplyInput(false);
                            }}
                            onCancel={() => setShowReplyInput(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── CommentSection ──
export default function CommentSection({ postId, commentCount, defaultOpen }: Props) {
    const [open, setOpen] = useState(defaultOpen ?? false);
    const [comments, setComments] = useState<CommentSummaryResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [error, setError] = useState('');

    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const loadComments = useCallback(async (pageNum: number) => {
        if (loading) return;
        setLoading(true);
        setError('');
        try {
            const res = await commentApi.getComments(postId, pageNum);
            const pageData = res.data.data;
            setComments(prev => pageNum === 0 ? pageData.content : [...prev, ...pageData.content]);
            setHasMore(!pageData.last);
            setPage(pageNum);
        } catch {
            setError('Không thể tải bình luận. Thử lại sau.');
        } finally {
            setLoading(false);
            setInitialLoaded(true);
        }
    }, [postId, loading]);

    const handleToggle = () => {
        if (!open && !initialLoaded) loadComments(0);
        setOpen(v => !v);
    };

    useEffect(() => {
        if (!open || !hasMore || loading || !initialLoaded) return;
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) loadComments(page + 1);
        }, { threshold: 0.5 });
        if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
        return () => observerRef.current?.disconnect();
    }, [open, hasMore, loading, page, loadComments, initialLoaded]);

    const handleNewComment = (comment: CommentSummaryResponse) => {
        setComments(prev => [comment, ...prev]);
    };

    return (
        <div style={{ fontFamily: 'Inter, sans-serif' }}>
            <button
                onClick={handleToggle}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#6B7280', padding: '6px 10px', borderRadius: 6 }}
            >
                <MessageCircle size={14} />
                Bình luận{commentCount != null && commentCount > 0 ? ` (${commentCount})` : ''}
                <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {open && (
                <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <CommentInput postId={postId} onSuccess={(c) => handleNewComment(c as CommentSummaryResponse)} />

                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 8, background: '#FEF2F2', color: '#EF4444', fontSize: 13 }}>
                            <AlertCircle size={14} />{error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {comments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                postId={postId}
                                onReplySuccess={() => {}}
                            />
                        ))}
                    </div>

                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                            <Loader2 size={20} color="#3B82F6" style={{ animation: 'spin 0.8s linear infinite' }} />
                        </div>
                    )}

                    {hasMore && !loading && <div ref={sentinelRef} style={{ height: 1 }} />}

                    {!hasMore && comments.length > 0 && (
                        <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                            Đã hiển thị tất cả bình luận
                        </p>
                    )}

                    {!loading && initialLoaded && comments.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <MessageCircle size={28} color="#D1D5DB" style={{ margin: '0 auto 8px' }} />
                            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                                Chưa có bình luận nào. Hãy là người đầu tiên!
                            </p>
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}