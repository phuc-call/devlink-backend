import React, {
    useState, useEffect, useRef, useCallback,
} from 'react';
import { X, Send, Heart, ChevronDown } from 'lucide-react';
import { commentApi } from '../../../api/post-service/commentApi';
import { reactionApi } from '../../../api/post-service/reactionApi';
import type {
    CommentSummaryResponse,
    SpringPage,
} from '../../../types/comment.types';
import styles from './CommentDrawer.module.css';

interface Props {
    postId: number;
    commentCount: number;
    onClose: () => void;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

const CommentDrawer: React.FC<Props> = ({ postId, commentCount, onClose }) => {
    const [comments, setComments] = useState<CommentSummaryResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [likedComments, setLikedComments] = useState<Set<number>>(new Set());

    const fetchComments = useCallback(async (pg: number) => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await commentApi.getComments(postId, pg);
            const pageData: SpringPage<CommentSummaryResponse> = res.data.data;
            setComments((prev) =>
                pg === 0 ? pageData.content : [...prev, ...pageData.content]
            );
            setHasMore(!pageData.last);
            setPage(pg);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, [postId, loading]);

    useEffect(() => {
        fetchComments(0);
        setTimeout(() => inputRef.current?.focus(), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId]);

    const handleSend = async () => {
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            const res = await commentApi.createComment({ postId, content: text.trim() });
            // Prepend optimistically
            const newComment: CommentSummaryResponse = {
                id: res.data.data.id,
                postId,
                authorId: res.data.data.authorId,
                content: text.trim(),
                status: 'ACTIVE',
                likeCount: 0,
                replyCount: 0,
                createdAt: new Date().toISOString(),
                userName: null,
                avatarUrl: null,
                type: 'COMMENT',
            };
            setComments((prev) => [newComment, ...prev]);
            setText('');
        } catch {
            /* ignore */
        } finally {
            setSending(false);
        }
    };

    const handleLikeComment = async (comment: CommentSummaryResponse) => {
        try {
            await reactionApi.react({
                targetId: comment.id,
                targetType: 'COMMENT',
                reactionType: 'LIKE',
            });
            setLikedComments((prev) => {
                const next = new Set(prev);
                if (next.has(comment.id)) next.delete(comment.id);
                else next.add(comment.id);
                return next;
            });
        } catch {
            /* ignore */
        }
    };

    return (
        <>
            {/* Overlay */}
            <div className={styles.drawerOverlay} onClick={onClose} />

            {/* Drawer */}
            <div className={styles.drawer}>
                <div className={styles.drawerHandle} />

                <div className={styles.drawerHeader}>
                    <span className={styles.drawerTitle}>
                        {commentCount.toLocaleString()} Comments
                    </span>
                    <button className={styles.drawerClose} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Comment list */}
                <div className={styles.commentList} ref={listRef}>
                    {comments.length === 0 && !loading && (
                        <div className={styles.emptyState}>
                            <MessageCircleIcon />
                            <span>No comments yet. Be the first!</span>
                        </div>
                    )}

                    {comments.map((c) => {
                        const liked = likedComments.has(c.id);
                        return (
                            <div key={c.id} className={styles.commentItem}>
                                {c.avatarUrl ? (
                                    <img
                                        src={c.avatarUrl}
                                        alt={c.userName ?? ''}
                                        className={styles.commentAvatar}
                                    />
                                ) : (
                                    <div className={styles.commentAvatarPlaceholder}>
                                        {(c.userName?.[0] ?? '?').toUpperCase()}
                                    </div>
                                )}
                                <div className={styles.commentBody}>
                                    <div className={styles.commentAuthor}>
                                        {c.userName ?? `User #${c.authorId}`}
                                    </div>
                                    <div className={styles.commentText}>{c.content}</div>
                                    <div className={styles.commentMeta}>
                                        <span className={styles.commentTime}>
                                            {timeAgo(c.createdAt)}
                                        </span>
                                        <button
                                            className={`${styles.commentLikeBtn} ${liked ? styles.commentLikeBtnActive : ''}`}
                                            onClick={() => handleLikeComment(c)}
                                        >
                                            <Heart
                                                size={13}
                                                fill={liked ? '#ef4444' : 'none'}
                                                color={liked ? '#ef4444' : 'currentColor'}
                                            />
                                            {(c.likeCount + (liked ? 1 : 0)) > 0 &&
                                                (c.likeCount + (liked ? 1 : 0))}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {hasMore && (
                        <div
                            className={styles.loadMore}
                            onClick={() => fetchComments(page + 1)}
                        >
                            {loading ? 'Loading…' : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                    <ChevronDown size={15} /> Load more
                                </span>
                            )}
                        </div>
                    )}

                    {loading && comments.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.spinner} />
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className={styles.commentInput}>
                    <input
                        ref={inputRef}
                        className={styles.commentInputField}
                        placeholder="Add a comment…"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        maxLength={500}
                    />
                    <button
                        className={styles.commentSendBtn}
                        onClick={handleSend}
                        disabled={!text.trim() || sending}
                        title="Send"
                    >
                        <Send size={16} color="#fff" />
                    </button>
                </div>
            </div>
        </>
    );
};

// Tiny inline icon to avoid extra import
const MessageCircleIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

export default CommentDrawer;
