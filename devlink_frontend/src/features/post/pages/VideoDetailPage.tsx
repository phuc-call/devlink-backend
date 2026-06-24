import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Heart, MessageCircle, Eye, Volume2, VolumeX,
    Play, Pause, Maximize2, ArrowLeft, Share2, Bookmark,
} from 'lucide-react';
import { videoFeedApi } from '../../../api/post-service/videoFeedApi';
import { reactionApi } from '../../../api/post-service/reactionApi';
import type { VideoFeedResponse } from '../../../types/video.types';
import type { ReactionResponse } from '../../../types/reaction.types';
import CommentDrawer from '../components/CommentDrawer';
import styles from './VideoDetailPage.module.css';

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function formatDuration(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} ngày trước`;
    return `${Math.floor(d / 30)} tháng trước`;
}

const VideoDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);

    const [video, setVideo] = useState<VideoFeedResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [captionExpanded, setCaptionExpanded] = useState(false);
    const [likeAnim, setLikeAnim] = useState(false);
    const [reaction, setReaction] = useState<ReactionResponse | null>(null);
    const [liking, setLiking] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch video detail
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        videoFeedApi.getVideoDetail(Number(id))
            .then(res => {
                setVideo(res.data.data);
                return reactionApi.getSummary(Number(id), 'POST');
            })
            .then(r => setReaction(r.data.data))
            .catch(e => {
                const msg = e?.response?.data?.message ?? e?.message ?? 'Không tìm thấy video';
                setError(msg);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const showControlsFor3s = useCallback(() => {
        setShowControls(true);
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }, []);

    const handleTogglePlay = useCallback(() => {
        const vid = videoRef.current;
        if (!vid) return;
        if (vid.paused) { vid.play(); setPlaying(true); }
        else { vid.pause(); setPlaying(false); }
        showControlsFor3s();
    }, [showControlsFor3s]);

    const onTimeUpdate = () => {
        const vid = videoRef.current;
        if (vid && vid.duration) {
            setCurrentTime(vid.currentTime);
            setProgress((vid.currentTime / vid.duration) * 100);
        }
    };

    const onLoadedMetadata = () => {
        const vid = videoRef.current;
        if (vid) {
            setDuration(vid.duration);
            vid.play().then(() => setPlaying(true)).catch(() => {});
        }
    };

    const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const vid = videoRef.current;
        if (!vid) return;
        const rect = e.currentTarget.getBoundingClientRect();
        vid.currentTime = ((e.clientX - rect.left) / rect.width) * vid.duration;
        showControlsFor3s();
    };

    const handleFullscreen = () => {
        const vid = videoRef.current;
        if (!vid) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else vid.requestFullscreen?.();
    };

    const handleLike = async () => {
        if (liking || !video) return;
        setLiking(true); setLikeAnim(true);
        setTimeout(() => setLikeAnim(false), 400);
        try {
            await reactionApi.react({ targetId: video.id, targetType: 'POST', reactionType: 'LIKE' });
            const r = await reactionApi.getSummary(video.id, 'POST');
            setReaction(r.data.data);
        } catch { /* ignore */ }
        finally { setLiking(false); }
    };

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.spinner} />
                <span>Đang tải video...</span>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className={styles.errorPage}>
                <span className={styles.errorIcon}>⚠️</span>
                <span className={styles.errorTitle}>Không tìm thấy video</span>
                <span className={styles.errorMsg}>{error}</span>
                <button className={styles.backBtn} onClick={() => navigate('/videos')}>
                    <ArrowLeft size={16} /> Quay lại
                </button>
            </div>
        );
    }

    const videoUrl = video.mediaList?.find(m => m.mediaType === 'VIDEO')?.url ?? '';
    const thumbnailUrl = video.mediaList?.find(m => m.mediaType === 'IMAGE')?.url ?? '';
    const author = video.author;
    const authorInitial = author?.fullName?.[0]?.toUpperCase() ?? '?';
    const captionText = video.content ?? '';
    const shouldTruncate = captionText.length > 200;
    const isLiked = reaction?.currentUserReaction === 'LIKE';
    const likeCount = reaction?.totalCount ?? video.likeCount ?? 0;

    return (
        <div className={styles.page}>
            {/* Back button */}
            <button className={styles.topBack} onClick={() => navigate('/videos')}>
                <ArrowLeft size={18} /> Videos
            </button>

            <div className={styles.layout}>
                {/* ── Left: Video Player ── */}
                <div className={styles.playerSection}>
                    <div
                        className={styles.playerWrap}
                        onMouseMove={showControlsFor3s}
                        onMouseLeave={() => playing && setShowControls(false)}
                    >
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            poster={thumbnailUrl || undefined}
                            className={styles.video}
                            muted={muted}
                            playsInline
                            onTimeUpdate={onTimeUpdate}
                            onLoadedMetadata={onLoadedMetadata}
                            onClick={handleTogglePlay}
                        />

                        {/* Controls overlay */}
                        <div className={`${styles.overlay} ${showControls || !playing ? styles.overlayVisible : ''}`}>
                            <button className={styles.centerPlayBtn} onClick={handleTogglePlay}>
                                {playing
                                    ? <Pause size={32} color="#fff" />
                                    : <Play size={32} color="#fff" fill="#fff" />
                                }
                            </button>
                            <div className={styles.bottomBar}>
                                <div className={styles.seekBar} onClick={onSeek}>
                                    <div className={styles.seekFill} style={{ width: `${progress}%` }}>
                                        <div className={styles.seekThumb} />
                                    </div>
                                </div>
                                <div className={styles.controlsRow}>
                                    <div className={styles.controlsLeft}>
                                        <button className={styles.ctrlBtn} onClick={handleTogglePlay}>
                                            {playing
                                                ? <Pause size={18} color="#fff" />
                                                : <Play size={18} color="#fff" fill="#fff" />
                                            }
                                        </button>
                                        <button className={styles.ctrlBtn} onClick={() => setMuted(m => !m)}>
                                            {muted
                                                ? <VolumeX size={18} color="#fff" />
                                                : <Volume2 size={18} color="#fff" />
                                            }
                                        </button>
                                        <span className={styles.timeLabel}>
                                            {formatDuration(currentTime)} / {formatDuration(duration)}
                                        </span>
                                    </div>
                                    <div className={styles.controlsRight}>
                                        <button className={styles.ctrlBtn} onClick={handleFullscreen}>
                                            <Maximize2 size={16} color="#fff" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: Info Panel ── */}
                <div className={styles.infoSection}>
                    {/* Author */}
                    <div className={styles.authorRow}>
                        <div className={styles.avatarWrap}>
                            {author?.avatarUrl ? (
                                <img src={author.avatarUrl} alt={author.fullName} className={styles.avatar} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>{authorInitial}</div>
                            )}
                        </div>
                        <div className={styles.authorMeta}>
                            <span className={styles.authorName}>{author?.fullName ?? `user_${video.authorId}`}</span>
                            <span className={styles.postTime}>{timeAgo(video.createdAt)}</span>
                        </div>
                        {author?.followerCount !== undefined && (
                            <span className={styles.followerBadge}>
                                {formatCount(author.followerCount)} followers
                            </span>
                        )}
                    </div>

                    {/* Caption */}
                    {captionText && (
                        <div className={styles.caption}>
                            <p>
                                {(!shouldTruncate || captionExpanded)
                                    ? captionText
                                    : `${captionText.slice(0, 200)}… `}
                            </p>
                            {shouldTruncate && (
                                <button className={styles.captionToggle} onClick={() => setCaptionExpanded(v => !v)}>
                                    {captionExpanded ? 'Thu gọn' : 'Xem thêm'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                        <div className={styles.tags}>
                            {video.tags.map(t => (
                                <span key={t.id} className={styles.tag}>#{t.tag}</span>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <Eye size={16} color="#65676b" />
                            <span>{formatCount(video.viewCount ?? 0)} lượt xem</span>
                        </div>
                        <div className={styles.stat}>
                            <Heart size={16} color="#65676b" />
                            <span>{formatCount(likeCount)} lượt thích</span>
                        </div>
                        <div className={styles.stat}>
                            <MessageCircle size={16} color="#65676b" />
                            <span>{formatCount(video.commentCount ?? 0)} bình luận</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className={styles.divider} />

                    {/* Actions */}
                    <div className={styles.actions}>
                        <button
                            className={`${styles.actionBtn} ${isLiked ? styles.actionBtnLiked : ''} ${likeAnim ? styles.likeAnim : ''}`}
                            onClick={handleLike}
                        >
                            <Heart size={18} color={isLiked ? '#ef4444' : undefined} fill={isLiked ? '#ef4444' : 'none'} />
                            <span>{isLiked ? 'Đã thích' : 'Thích'}</span>
                        </button>

                        <button
                            className={styles.actionBtn}
                            onClick={() => setCommentOpen(true)}
                        >
                            <MessageCircle size={18} />
                            <span>Bình luận</span>
                        </button>

                        <button className={styles.actionBtn}>
                            <Share2 size={18} />
                            <span>Chia sẻ</span>
                        </button>

                        <button className={styles.actionBtn}>
                            <Bookmark size={18} />
                            <span>Lưu</span>
                        </button>
                    </div>

                    {/* Comment section (inline for wide screens) */}
                    <div className={styles.commentsHeader}>
                        <MessageCircle size={16} />
                        <span>Bình luận ({formatCount(video.commentCount ?? 0)})</span>
                    </div>
                </div>
            </div>

            {/* Comment Drawer (for mobile / on click) */}
            {commentOpen && (
                <CommentDrawer
                    postId={video.id}
                    commentCount={video.commentCount ?? 0}
                    onClose={() => setCommentOpen(false)}
                />
            )}
        </div>
    );
};

export default VideoDetailPage;
