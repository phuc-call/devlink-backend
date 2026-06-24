import React, {
    useState, useEffect, useRef, useCallback,
} from 'react';
import {
    Heart, MessageCircle, Eye, Play, Volume2, VolumeX,
    Pause, Send, ChevronDown, Maximize2, ArrowLeft,
    Bookmark, Share2, ChevronUp, MoreHorizontal,
} from 'lucide-react';
import { videoFeedApi } from '../../../api/post-service/videoFeedApi';
import { reactionApi } from '../../../api/post-service/reactionApi';
import { commentApi } from '../../../api/post-service/commentApi';
import { savedPostApi } from '../../../api/post-service/savedPostApi';
import type { VideoFeedResponse } from '../../../types/video.types';
import type { ReactionResponse } from '../../../types/reaction.types';
import type { CommentSummaryResponse, CommentReplyResponse, SpringPage } from '../../../types/comment.types';
import styles from './VideoFeedPage.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}
function timeAgo(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    return d < 30 ? `${d} ngày trước` : `${Math.floor(d / 30)} tháng trước`;
}
function fmtDur(s: number) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── CommentItem ─────────────────────────────────────────────────────────────
interface CommentItemProps {
    comment: CommentSummaryResponse;
    onReply: (commentId: number, name: string) => void;
}
const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply }) => {
    const [replies, setReplies] = useState<CommentReplyResponse[]>([]);
    const [replyPage, setReplyPage] = useState(0);
    const [replyHasMore, setReplyHasMore] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.likeCount ?? 0);

    const loadReplies = async (pg: number) => {
        setLoadingReplies(true);
        try {
            const r = await commentApi.getReplies(comment.id, pg);
            const d: SpringPage<CommentReplyResponse> = r.data.data as any;
            setReplies(prev => pg === 0 ? d.content : [...prev, ...d.content]);
            setReplyHasMore(!d.last);
            setReplyPage(pg);
        } catch { /* ignore */ } finally { setLoadingReplies(false); }
    };

    const toggleReplies = () => {
        if (!showReplies && replies.length === 0 && comment.replyCount > 0) {
            loadReplies(0);
        }
        setShowReplies(v => !v);
    };

    const handleLikeComment = async () => {
        try {
            await reactionApi.react({ targetId: comment.id, targetType: 'COMMENT' as any, reactionType: 'LIKE' });
            setLiked(v => !v);
            setLikeCount(n => liked ? n - 1 : n + 1);
        } catch { /* ignore */ }
    };

    const initial = comment.fullName?.[0]?.toUpperCase() ?? '?';

    return (
        <div className={styles.commentItem}>
            <div className={styles.commentMain}>
                {comment.avatarUrl
                    ? <img src={comment.avatarUrl} className={styles.cAvatar} alt="" />
                    : <div className={styles.cAvatarPh}>{initial}</div>
                }
                <div className={styles.cContent}>
                    <div className={styles.cBubble}>
                        <span className={styles.cName}>{comment.fullName ?? `user_${comment.authorId}`}</span>
                        <p className={styles.cText}>{comment.content}</p>
                    </div>
                    <div className={styles.cMeta}>
                        <span className={styles.cTime}>{timeAgo(comment.createdAt)}</span>
                        <button
                            className={`${styles.cMetaBtn} ${liked ? styles.cMetaBtnLiked : ''}`}
                            onClick={handleLikeComment}
                        >
                            Thích {likeCount > 0 && `· ${fmt(likeCount)}`}
                        </button>
                        <button
                            className={styles.cMetaBtn}
                            onClick={() => onReply(comment.id, comment.fullName ?? `user_${comment.authorId}`)}
                        >
                            Phản hồi
                        </button>
                        {comment.replyCount > 0 && (
                            <button className={styles.cMetaBtn} onClick={toggleReplies}>
                                {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {showReplies ? 'Ẩn' : `${comment.replyCount} phản hồi`}
                            </button>
                        )}
                    </div>

                    {/* Replies */}
                    {showReplies && (
                        <div className={styles.replyList}>
                            {replies.map(rp => (
                                <div key={rp.id} className={styles.replyItem}>
                                    {rp.avatarUrl
                                        ? <img src={rp.avatarUrl} className={styles.rAvatar} alt="" />
                                        : <div className={styles.rAvatarPh}>{rp.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                                    }
                                    <div className={styles.cContent}>
                                        <div className={styles.cBubble}>
                                            <span className={styles.cName}>{rp.fullName ?? `user_${rp.authorId}`}</span>
                                            <p className={styles.cText}>{rp.content}</p>
                                        </div>
                                        <div className={styles.cMeta}>
                                            <span className={styles.cTime}>{timeAgo(rp.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loadingReplies && <div className={styles.spinnerSm} style={{ margin: '8px auto' }} />}
                            {replyHasMore && !loadingReplies && (
                                <button className={styles.loadMoreRepliesBtn} onClick={() => loadReplies(replyPage + 1)}>
                                    Xem thêm phản hồi
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── VideoDetailInline ────────────────────────────────────────────────────────
// Hiển thị inline trong feed: video + info + comment ngay bên dưới (không modal)
interface DetailInlineProps {
    video: VideoFeedResponse;
    siblingVideos: VideoFeedResponse[];         // các video cùng loại để scroll tiếp
    onClose: () => void;
    hasMore: boolean;
    onLoadMore: () => void;
}

const VideoDetailInline: React.FC<DetailInlineProps> = ({
    video: initialVideo,
    siblingVideos,
    onClose,
    hasMore,
    onLoadMore,
}) => {
    // activeIndex: 0 = video được bấm, 1+ = video tiếp theo cùng loại
    const [activeIdx, setActiveIdx] = useState(0);

    // Danh sách video đang hiển thị trong detail scroll
    const detailList = [initialVideo, ...siblingVideos];
    const activeVideo = detailList[activeIdx] ?? initialVideo;

    return (
        <div className={styles.detailPage}>
            {/* ── Back bar ── */}
            <div className={styles.detailBackBar}>
                <button className={styles.detailBackBtn} onClick={onClose}>
                    <ArrowLeft size={16} /> Quay lại
                </button>
                <span className={styles.detailBackLabel}>Videos</span>
            </div>

            {/* ── Scroll container: danh sách video detail ── */}
            <div className={styles.detailScroll}>
                {detailList.map((v, idx) => (
                    <VideoDetailItem
                        key={v.id}
                        video={v}
                        isActive={idx === activeIdx}
                        onVisible={() => setActiveIdx(idx)}
                    />
                ))}

                {/* Load more cùng loại */}
                {hasMore && (
                    <div className={styles.loadMoreDetRow}>
                        <button className={styles.loadMoreDetBtn} onClick={onLoadMore}>
                            <ChevronDown size={18} /> Xem thêm video cùng loại
                        </button>
                    </div>
                )}
                {!hasMore && detailList.length > 0 && (
                    <p className={styles.endMsg}>Đã xem hết 🎬</p>
                )}
            </div>
        </div>
    );
};

// ─── VideoDetailItem ─────────────────────────────────────────────────────────
// Mỗi card trong trang detail: player (16:9) + info + comment
interface DetailItemProps {
    video: VideoFeedResponse;
    isActive: boolean;
    onVisible: () => void;
}
const VideoDetailItem: React.FC<DetailItemProps> = ({ video, isActive, onVisible }) => {
    const vRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [detailVideo, setDetailVideo] = useState<VideoFeedResponse>(video);
    const [reaction, setReaction] = useState<ReactionResponse | null>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [curTime, setCurTime] = useState(0);
    const [showCtrl, setShowCtrl] = useState(true);
    const [liking, setLiking] = useState(false);
    const [likeAnim, setLikeAnim] = useState(false);
    const [saved, setSaved] = useState(false);
    const [captionExpanded, setCaptionExpanded] = useState(false);
    const ctrlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Comments
    const [comments, setComments] = useState<CommentSummaryResponse[]>([]);
    const [cPage, setCPage] = useState(0);
    const [cHasMore, setCHasMore] = useState(true);
    const [cLoading, setCLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        reactionApi.getSummary(video.id, 'POST')
            .then(r => setReaction(r.data.data))
            .catch(() => { });
        loadComments(0);
    }, [video.id]);

    // IntersectionObserver: autoplay khi vào view
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                onVisible();
                vRef.current?.play().then(() => setPlaying(true)).catch(() => { });
            } else {
                vRef.current?.pause();
                setPlaying(false);
            }
        }, { threshold: 0.5 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [onVisible]);

    const loadComments = async (pg: number) => {
        setCLoading(true);
        try {
            const r = await commentApi.getComments(video.id, pg);
            const d: SpringPage<CommentSummaryResponse> = r.data.data;
            setComments(prev => pg === 0 ? d.content : [...prev, ...d.content]);
            setCHasMore(!d.last);
            setCPage(pg);
        } catch { /* ignore */ } finally { setCLoading(false); }
    };

    const showFor3s = useCallback(() => {
        setShowCtrl(true);
        if (ctrlTimer.current) clearTimeout(ctrlTimer.current);
        ctrlTimer.current = setTimeout(() => setShowCtrl(false), 3000);
    }, []);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = vRef.current; if (!v) return;
        if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
        showFor3s();
    };

    const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const v = vRef.current; if (!v) return;
        const r = e.currentTarget.getBoundingClientRect();
        v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
        showFor3s();
    };

    const handleLike = async () => {
        if (liking) return;
        setLiking(true); setLikeAnim(true);
        setTimeout(() => setLikeAnim(false), 400);
        try {
            await reactionApi.react({ targetId: video.id, targetType: 'POST', reactionType: 'LIKE' });
            const r = await reactionApi.getSummary(video.id, 'POST');
            setReaction(r.data.data);
        } catch { /* ignore */ } finally { setLiking(false); }
    };

    const handleSave = async () => {
        try {
            if (saved) {
                await savedPostApi.unsavePost(video.id);
            } else {
                await savedPostApi.savePost(video.id);
            }
            setSaved(v => !v);
        } catch { /* ignore */ }
    };

    const handleSend = async () => {
        if (!commentText.trim() || sending) return;
        setSending(true);
        try {
            if (replyTo) {
                // Gửi reply
                await commentApi.createReply({
                    commentId: replyTo.id,
                    content: commentText.trim(),
                    postId: video.id,
                } as any);
                setReplyTo(null);
            } else {
                // Gửi comment mới
                const r = await commentApi.createComment({ postId: video.id, content: commentText.trim() });
                const nc: CommentSummaryResponse = {
                    id: r.data.data.id,
                    postId: video.id,
                    authorId: r.data.data.authorId,
                    content: commentText.trim(),
                    status: 'ACTIVE',
                    likeCount: 0,
                    replyCount: 0,
                    createdAt: new Date().toISOString(),
                    fullName: null,
                    avatarUrl: null,
                    type: 'COMMENT',
                };
                setComments(prev => [nc, ...prev]);
            }
            setCommentText('');
        } catch { /* ignore */ } finally { setSending(false); }
    };

    const videoUrl = video.mediaList?.find(m => m.mediaType === 'VIDEO')?.url ?? '';
    const thumbUrl = video.mediaList?.find(m => m.mediaType === 'IMAGE')?.url ?? '';
    const author = video.author;
    const authorInitial = author?.fullName?.[0]?.toUpperCase() ?? '?';
    const isLiked = reaction?.currentUserReaction === 'LIKE';
    const likeCount = reaction?.totalCount ?? video.likeCount ?? 0;
    const captionText = video.content ?? '';
    const shouldTruncate = captionText.length > 180;

    return (
        <div className={styles.detailItem} ref={containerRef}>
            {/* ── Author header ── */}
            <div className={styles.detailHeader}>
                {author?.avatarUrl
                    ? <img src={author.avatarUrl} className={styles.detailAvatar} alt="" />
                    : <div className={styles.detailAvatarPh}>{authorInitial}</div>
                }
                <div className={styles.detailAuthorInfo}>
                    <span className={styles.detailAuthorName}>{author?.fullName ?? `user_${video.authorId}`}</span>
                    <span className={styles.detailPostTime}>{timeAgo(video.createdAt)}</span>
                </div>
                <button className={styles.moreBtn}><MoreHorizontal size={18} color="#65676b" /></button>
            </div>

            {/* Caption trước video (giống FB) */}
            {captionText && (
                <div className={styles.detailCaptionTop}>
                    {!shouldTruncate || captionExpanded
                        ? captionText
                        : `${captionText.slice(0, 180)}… `}
                    {shouldTruncate && (
                        <button className={styles.captionToggle} onClick={() => setCaptionExpanded(v => !v)}>
                            {captionExpanded ? 'Thu gọn' : 'Xem thêm'}
                        </button>
                    )}
                </div>
            )}

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
                <div className={styles.detailTagsTop}>
                    {video.tags.map(t => <span key={t.id} className={styles.tag}>#{t.tag}</span>)}
                </div>
            )}

            {/* ── Video player 16:9 ── */}
            <div
                className={styles.detailPlayer}
                onMouseMove={showFor3s}
                onMouseLeave={() => playing && setShowCtrl(false)}
            >
                <video
                    ref={vRef}
                    src={videoUrl}
                    poster={thumbUrl || undefined}
                    className={styles.detailVideo}
                    muted={muted}
                    playsInline
                    onTimeUpdate={() => {
                        const v = vRef.current;
                        if (v && v.duration) { setCurTime(v.currentTime); setProgress(v.currentTime / v.duration * 100); }
                    }}
                    onLoadedMetadata={() => {
                        const v = vRef.current;
                        if (v) setDuration(v.duration);
                    }}
                    onClick={togglePlay}
                />

                {/* Controls overlay */}
                <div className={`${styles.playerOverlay} ${showCtrl || !playing ? styles.playerOverlayOn : ''}`}>
                    {/* Center play button */}
                    <button className={styles.centerPlayBtn} onClick={togglePlay}>
                        {playing
                            ? <Pause size={32} color="#fff" />
                            : <Play size={32} color="#fff" fill="#fff" />
                        }
                    </button>

                    {/* Bottom bar */}
                    <div className={styles.playerBottomBar}>
                        <div className={styles.seekBar} onClick={onSeek}>
                            <div className={styles.seekFill} style={{ width: `${progress}%` }}>
                                <div className={styles.seekDot} />
                            </div>
                        </div>
                        <div className={styles.ctrlRow}>
                            <div className={styles.ctrlLeft}>
                                <button className={styles.ctrlBtn} onClick={togglePlay}>
                                    {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" fill="#fff" />}
                                </button>
                                <button className={styles.ctrlBtn} onClick={e => { e.stopPropagation(); setMuted(m => !m); }}>
                                    {muted ? <VolumeX size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
                                </button>
                                <span className={styles.timeLabel}>{fmtDur(curTime)} / {fmtDur(duration)}</span>
                            </div>
                            <div className={styles.ctrlRight}>
                                <button className={styles.ctrlBtn} onClick={() => vRef.current?.requestFullscreen?.()}>
                                    <Maximize2 size={14} color="#fff" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats + Actions (FB style: dưới video) ── */}
            <div className={styles.detailUnderVideo}>
                {/* Stats row */}
                <div className={styles.statsRow}>
                    <span className={styles.statChip}>
                        <Heart size={13} fill="#ef4444" color="#ef4444" />
                        {fmt(likeCount)}
                    </span>
                    <span className={styles.statChipRight}>
                        {fmt(video.commentCount ?? 0)} bình luận · {fmt(video.viewCount ?? 0)} lượt xem
                    </span>
                </div>

                <div className={styles.actionDivider} />

                {/* Action buttons */}
                <div className={styles.actionRow}>
                    <button
                        className={`${styles.actionBtn} ${isLiked ? styles.actionBtnLiked : ''} ${likeAnim ? styles.likeAnim : ''}`}
                        onClick={handleLike}
                    >
                        <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#65676b'} />
                        <span>{isLiked ? 'Đã thích' : 'Thích'}</span>
                    </button>

                    <button className={styles.actionBtn}>
                        <MessageCircle size={18} color="#65676b" />
                        <span>Bình luận</span>
                    </button>

                    <button className={styles.actionBtn}>
                        <Share2 size={18} color="#65676b" />
                        <span>Chia sẻ</span>
                    </button>

                    <button
                        className={`${styles.actionBtn} ${saved ? styles.actionBtnSaved : ''}`}
                        onClick={handleSave}
                    >
                        <Bookmark size={18} fill={saved ? '#1877f2' : 'none'} color={saved ? '#1877f2' : '#65676b'} />
                        <span>{saved ? 'Đã lưu' : 'Lưu'}</span>
                    </button>
                </div>

                <div className={styles.actionDivider} />

                {/* ── Comment input ── */}
                <div className={styles.commentInputRow}>
                    <div className={styles.commentInputWrap}>
                        {replyTo && (
                            <div className={styles.replyToChip}>
                                Đang phản hồi <strong>{replyTo.name}</strong>
                                <button className={styles.replyCancel} onClick={() => setReplyTo(null)}>×</button>
                            </div>
                        )}
                        <div className={styles.commentInputInner}>
                            <input
                                className={styles.commentInput}
                                placeholder={replyTo ? `Phản hồi ${replyTo.name}…` : 'Viết bình luận…'}
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            />
                            <button
                                className={styles.sendBtn}
                                onClick={handleSend}
                                disabled={!commentText.trim() || sending}
                            >
                                <Send size={16} color="#fff" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Comment list ── */}
                <div className={styles.commentList}>
                    {cLoading && comments.length === 0 && <div className={styles.spinnerSm} style={{ margin: '16px auto' }} />}
                    {comments.length === 0 && !cLoading && (
                        <p className={styles.noComments}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                    )}
                    {comments.map(c => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            onReply={(id, name) => setReplyTo({ id, name })}
                        />
                    ))}
                    {cHasMore && (
                        <button
                            className={styles.loadMoreBtn}
                            onClick={() => loadComments(cPage + 1)}
                            disabled={cLoading}
                        >
                            {cLoading ? <div className={styles.spinnerSm} /> : 'Xem thêm bình luận'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── ShortCard ────────────────────────────────────────────────────────────────
interface ShortCardProps { video: VideoFeedResponse; onOpen: (id: number) => void; }
const ShortCard: React.FC<ShortCardProps> = ({ video, onOpen }) => {
    const vRef = useRef<HTMLVideoElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [hovering, setHovering] = useState(false);
    const [muted, setMuted] = useState(true);
    const videoUrl = video.mediaList?.find(m => m.mediaType === 'VIDEO')?.url ?? '';
    const thumbUrl = video.mediaList?.find(m => m.mediaType === 'IMAGE')?.url ?? '';
    const author = video.author;

    useEffect(() => {
        const v = vRef.current; if (!v || !videoUrl) return;
        if (hovering) { v.play().catch(() => { }); } else { v.pause(); v.currentTime = 0; }
    }, [hovering, videoUrl]);

    return (
        <div
            className={styles.shortCard}
            ref={cardRef}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={() => onOpen(video.id)}
        >
            {thumbUrl && !hovering && <img src={thumbUrl} className={styles.shortThumb} alt="" />}
            {!thumbUrl && !hovering && <div className={styles.shortNoThumb}><Play size={28} color="rgba(255,255,255,0.5)" /></div>}
            {videoUrl && (
                <video
                    ref={vRef}
                    src={videoUrl}
                    className={`${styles.shortVideo} ${hovering ? styles.shortVideoOn : ''}`}
                    muted={muted}
                    loop
                    playsInline
                />
            )}
            <div className={styles.shortGradient} />

            {/* Mute toggle */}
            <button
                className={styles.shortMuteBtn}
                onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
            >
                {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>

            {/* Info bottom */}
            <div className={styles.shortInfo}>
                <div className={styles.shortAuthorRow}>
                    {author?.avatarUrl
                        ? <img src={author.avatarUrl} className={styles.shortAvatar} alt="" />
                        : <div className={styles.shortAvatarPh}>{author?.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                    }
                    <span className={styles.shortAuthorName}>{author?.fullName ?? `user_${video.authorId}`}</span>
                </div>
                <div className={styles.shortStats}>
                    <span><Heart size={10} /> {fmt(video.likeCount ?? 0)}</span>
                    <span><Eye size={10} /> {fmt(video.viewCount ?? 0)}</span>
                </div>
            </div>
        </div>
    );
};

// ─── LongCard (feed thumbnail) ────────────────────────────────────────────────
interface LongCardProps { video: VideoFeedResponse; onOpen: (id: number) => void; }
const LongCard: React.FC<LongCardProps> = ({ video, onOpen }) => {
    const vRef = useRef<HTMLVideoElement>(null);
    const cRef = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showCtrl, setShowCtrl] = useState(false);
    const [reaction, setReaction] = useState<ReactionResponse | null>(null);
    const ctrlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const videoUrl = video.mediaList?.find(m => m.mediaType === 'VIDEO')?.url ?? '';
    const thumbUrl = video.mediaList?.find(m => m.mediaType === 'IMAGE')?.url ?? '';
    const author = video.author;

    useEffect(() => {
        reactionApi.getSummary(video.id, 'POST').then(r => setReaction(r.data.data)).catch(() => { });
    }, [video.id]);

    useEffect(() => {
        const v = vRef.current; if (!v || !videoUrl) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { v.play().then(() => setPlaying(true)).catch(() => { }); }
            else { v.pause(); setPlaying(false); }
        }, { threshold: 0.5 });
        if (cRef.current) obs.observe(cRef.current);
        return () => obs.disconnect();
    }, [videoUrl]);

    const showFor3s = () => {
        setShowCtrl(true);
        if (ctrlTimer.current) clearTimeout(ctrlTimer.current);
        ctrlTimer.current = setTimeout(() => setShowCtrl(false), 2500);
    };

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = vRef.current; if (!v) return;
        if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
        showFor3s();
    };

    const isLiked = reaction?.currentUserReaction === 'LIKE';

    return (
        <article className={styles.longCard} ref={cRef}>
            {/* Author */}
            <div className={styles.longHeader}>
                {author?.avatarUrl
                    ? <img src={author.avatarUrl} className={styles.longAvatar} alt="" />
                    : <div className={styles.longAvatarPh}>{author?.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                }
                <div className={styles.longAuthorInfo}>
                    <span className={styles.longAuthorName}>{author?.fullName ?? `user_${video.authorId}`}</span>
                    <span className={styles.longTime}>{timeAgo(video.createdAt)}</span>
                </div>
                <button className={styles.moreBtn}><MoreHorizontal size={18} color="#65676b" /></button>
            </div>

            {video.content && (
                <p className={styles.longCaption}>
                    {video.content.length > 100 ? video.content.slice(0, 100) + '…' : video.content}
                </p>
            )}

            {/* Player — click mở detail inline */}
            <div
                className={styles.longPlayer}
                onMouseMove={showFor3s}
                onMouseLeave={() => setShowCtrl(false)}
                onClick={() => onOpen(video.id)}
            >
                <video
                    ref={vRef}
                    src={videoUrl}
                    poster={thumbUrl || undefined}
                    className={styles.longVideo}
                    loop
                    muted={muted}
                    playsInline
                    onTimeUpdate={() => {
                        const v = vRef.current;
                        if (v && v.duration) setProgress(v.currentTime / v.duration * 100);
                    }}
                    onClick={togglePlay}
                />

                <div className={`${styles.longGlass} ${showCtrl || !playing ? styles.longGlassOn : ''}`}>
                    <button className={styles.longPlayBtn} onClick={togglePlay}>
                        {playing ? <Pause size={24} color="#fff" /> : <Play size={24} color="#fff" fill="#fff" />}
                    </button>
                    <div className={styles.longBottomCtrl}>
                        <div className={styles.seekBarLong} onClick={e => { e.stopPropagation(); }}>
                            <div className={styles.seekFillLong} style={{ width: `${progress}%` }} />
                        </div>
                        <div className={styles.ctrlRow}>
                            <button className={styles.ctrlBtn} onClick={togglePlay}>
                                {playing ? <Pause size={13} color="#fff" /> : <Play size={13} color="#fff" fill="#fff" />}
                            </button>
                            <button className={styles.ctrlBtn} onClick={e => { e.stopPropagation(); setMuted(m => !m); }}>
                                {muted ? <VolumeX size={13} color="#fff" /> : <Volume2 size={13} color="#fff" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* "Xem video" hint */}
                <div className={styles.watchHint}>Nhấn để xem chi tiết</div>
            </div>

            {/* Actions */}
            <div className={styles.longActions}>
                <div className={styles.longStat}>
                    <Heart size={15} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#65676b'} />
                    {fmt(reaction?.totalCount ?? video.likeCount ?? 0)}
                </div>
                <div className={styles.longStat}>
                    <MessageCircle size={15} color="#65676b" />
                    {fmt(video.commentCount ?? 0)}
                </div>
                <div className={styles.longStat}>
                    <Eye size={15} color="#65676b" />
                    {fmt(video.viewCount ?? 0)}
                </div>
            </div>
        </article>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const VideoFeedPage: React.FC = () => {
    const [shortVideos, setShortVideos] = useState<VideoFeedResponse[]>([]);
    const [longVideos, setLongVideos] = useState<VideoFeedResponse[]>([]);
    const [shortPage, setShortPage] = useState(0);
    const [longPage, setLongPage] = useState(0);
    const [shortHasMore, setShortHasMore] = useState(true);
    const [longHasMore, setLongHasMore] = useState(true);
    const [longLoading, setLongLoading] = useState(false);

    // selectedVideo: video được bấm để mở detail
    // selectedType: 'short' | 'long' để biết kéo tiếp loại nào
    const [selectedVideo, setSelectedVideo] = useState<VideoFeedResponse | null>(null);
    const [selectedType, setSelectedType] = useState<'short' | 'long'>('long');

    const longLoadingRef = useRef(false);
    const longContRef = useRef<HTMLDivElement>(null);

    const fetchShort = useCallback(async (pg: number) => {
        try {
            const r = await videoFeedApi.getShortVideos(pg, 12);
            const d = r.data.data;
            setShortVideos(prev => pg === 0 ? d.content : [...prev, ...d.content]);
            setShortHasMore(!d.last);
            setShortPage(pg);
        } catch { /* ignore */ }
    }, []);

    const fetchLong = useCallback(async (pg: number) => {
        if (longLoadingRef.current) return;
        longLoadingRef.current = true;
        setLongLoading(true);
        try {
            const r = await videoFeedApi.getLongVideos(pg, 10);
            const d = r.data.data;
            setLongVideos(prev => pg === 0 ? d.content : [...prev, ...d.content]);
            setLongHasMore(!d.last);
            setLongPage(pg);
        } catch { /* ignore */ } finally { setLongLoading(false); longLoadingRef.current = false; }
    }, []);

    useEffect(() => { fetchShort(0); fetchLong(0); }, []);

    // Infinite scroll cho long feed
    const handleScroll = useCallback(() => {
        const el = longContRef.current; if (!el) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 600 && longHasMore && !longLoadingRef.current) {
            fetchLong(longPage + 1);
        }
    }, [longHasMore, longPage, fetchLong]);

    const openDetail = (id: number, type: 'short' | 'long') => {
        const list = type === 'short' ? shortVideos : longVideos;
        const found = list.find(v => v.id === id) ?? null;
        setSelectedVideo(found);
        setSelectedType(type);
    };

    // Siblings = video cùng loại, bỏ video đã chọn
    const siblings = selectedVideo
        ? (selectedType === 'short' ? shortVideos : longVideos).filter(v => v.id !== selectedVideo.id)
        : [];

    // ── Render detail view ──
    if (selectedVideo) {
        return (
            <VideoDetailInline
                video={selectedVideo}
                siblingVideos={siblings}
                onClose={() => setSelectedVideo(null)}
                hasMore={selectedType === 'short' ? shortHasMore : longHasMore}
                onLoadMore={() => {
                    if (selectedType === 'short') fetchShort(shortPage + 1);
                    else fetchLong(longPage + 1);
                }}
            />
        );
    }

    // ── Render feed view ──
    return (
        <div className={styles.page}>
            <div
                className={styles.feedContainer}
                ref={longContRef}
                onScroll={handleScroll}
            >
                {/* Shorts */}
                {shortVideos.length > 0 && (
                    <section className={styles.shortsSection}>
                        <h2 className={styles.sectionTitle}>
                            <span className={styles.sectionDot} /> Shorts
                        </h2>
                        <div className={styles.shortsRow}>
                            {shortVideos.map(v => (
                                <ShortCard key={v.id} video={v} onOpen={id => openDetail(id, 'short')} />
                            ))}
                            {shortHasMore && (
                                <button className={styles.loadMoreShortBtn} onClick={() => fetchShort(shortPage + 1)}>
                                    <ChevronDown size={18} /><span>Thêm</span>
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {/* Long videos */}
                <section className={styles.longSection}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionDot} style={{ background: '#6366f1' }} /> Videos
                    </h2>
                    {longVideos.length === 0 && longLoading && (
                        <div className={styles.centerState}><div className={styles.spinner} /><span>Đang tải...</span></div>
                    )}
                    {longVideos.length === 0 && !longLoading && (
                        <div className={styles.centerState}>
                            <span className={styles.emptyEmoji}>🎬</span>
                            <span className={styles.emptyTitle}>Chưa có video nào</span>
                        </div>
                    )}
                    <div className={styles.longList}>
                        {longVideos.map(v => (
                            <LongCard key={v.id} video={v} onOpen={id => openDetail(id, 'long')} />
                        ))}
                    </div>
                    {longLoading && longVideos.length > 0 && (
                        <div className={styles.centerState}><div className={styles.spinnerSm} /></div>
                    )}
                    {!longHasMore && longVideos.length > 0 && (
                        <p className={styles.endMsg}>Đã xem hết 🎬</p>
                    )}
                </section>
            </div>
        </div>
    );
};

export default VideoFeedPage;