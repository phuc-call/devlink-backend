import React, {
    useRef, useState, useEffect, useCallback,
} from 'react';
import {
    Heart, MessageCircle, Eye, Volume2, VolumeX,
    Play, Pause, Maximize2, MoreHorizontal,
} from 'lucide-react';
import { reactionApi } from '../../../api/post-service/reactionApi';
import type { VideoFeedResponse } from '../../../types/video.types';
import type { ReactionResponse } from '../../../types/reaction.types';
import styles from './CommentDrawer.module.css'; // placeholder — component not actively used

interface Props {
    video: VideoFeedResponse;
    onOpenComments: (videoId: number) => void;
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return `${Math.floor(d / 30)}mo ago`;
}

const LongVideoCard: React.FC<Props> = ({ video, onOpenComments }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
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
    const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const videoUrl = video.mediaList?.find((m) => m.mediaType === 'VIDEO')?.url ?? '';
    const thumbnailUrl = video.mediaList?.find((m) => m.mediaType === 'IMAGE')?.url ?? '';

    // Fetch reaction on mount
    useEffect(() => {
        reactionApi
            .getSummary(video.id, 'POST')
            .then((r) => setReaction(r.data.data))
            .catch(() => null);
    }, [video.id]);

    // IntersectionObserver: autoplay when 50% in view
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid || !videoUrl) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    vid.play().then(() => setPlaying(true)).catch(() => {});
                } else {
                    vid.pause();
                    setPlaying(false);
                }
            },
            { threshold: 0.5 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [videoUrl]);

    const showControlsTemporarily = useCallback(() => {
        setShowControls(true);
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => {
            if (playing) setShowControls(false);
        }, 3000);
    }, [playing]);

    const handleTogglePlay = useCallback(() => {
        const vid = videoRef.current;
        if (!vid) return;
        if (vid.paused) {
            vid.play();
            setPlaying(true);
        } else {
            vid.pause();
            setPlaying(false);
            setShowControls(true);
        }
        showControlsTemporarily();
    }, [showControlsTemporarily]);

    const onTimeUpdate = () => {
        const vid = videoRef.current;
        if (vid && vid.duration) {
            setCurrentTime(vid.currentTime);
            setProgress((vid.currentTime / vid.duration) * 100);
        }
    };

    const onLoadedMetadata = () => {
        const vid = videoRef.current;
        if (vid) setDuration(vid.duration);
    };

    const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const vid = videoRef.current;
        if (!vid) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        vid.currentTime = pct * vid.duration;
        showControlsTemporarily();
    };

    const handleFullscreen = () => {
        const vid = videoRef.current;
        if (!vid) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            vid.requestFullscreen?.();
        }
    };

    const handleLike = async () => {
        if (liking) return;
        setLiking(true);
        setLikeAnim(true);
        setTimeout(() => setLikeAnim(false), 400);
        try {
            await reactionApi.react({
                targetId: video.id,
                targetType: 'POST',
                reactionType: 'LIKE',
            });
            const r = await reactionApi.getSummary(video.id, 'POST');
            setReaction(r.data.data);
        } catch { /* ignore */ }
        finally { setLiking(false); }
    };

    const isLiked = reaction?.currentUserReaction === 'LIKE';
    const likeCount = reaction?.totalCount ?? video.likeCount ?? 0;
    const author = video.author;
    const authorInitial = author?.userName?.[0]?.toUpperCase() ?? '?';
    const captionText = video.content ?? '';
    const shouldTruncate = captionText.length > 120;

    return (
        <article className={styles.longCard} ref={containerRef}>
            {/* ── Video player ── */}
            <div
                className={styles.longPlayerWrap}
                onMouseMove={showControlsTemporarily}
                onMouseLeave={() => playing && setShowControls(false)}
            >
                {/* Bucket badge */}
                {video.feedBucket && (
                    <div className={`${styles.longBucketBadge} ${
                        video.feedBucket === 'PRIORITY' ? styles.bucketPriority : styles.bucketDiscovery
                    }`}>
                        {video.feedBucket === 'PRIORITY' ? '⚡ Priority' : '🔍 Discovery'}
                    </div>
                )}

                <video
                    ref={videoRef}
                    src={videoUrl}
                    poster={thumbnailUrl || undefined}
                    className={styles.longVideo}
                    loop
                    muted={muted}
                    playsInline
                    onTimeUpdate={onTimeUpdate}
                    onLoadedMetadata={onLoadedMetadata}
                    onClick={handleTogglePlay}
                />

                {/* Center play/pause overlay */}
                <div
                    className={`${styles.longCenterOverlay} ${showControls || !playing ? styles.longControlsVisible : ''}`}
                    onClick={handleTogglePlay}
                >
                    <div className={styles.longPlayBtn}>
                        {playing
                            ? <Pause size={28} color="#fff" />
                            : <Play size={28} color="#fff" fill="#fff" />
                        }
                    </div>
                </div>

                {/* Bottom controls bar */}
                <div className={`${styles.longControls} ${showControls || !playing ? styles.longControlsVisible : ''}`}>
                    {/* Progress bar */}
                    <div className={styles.longProgressBar} onClick={onSeek}>
                        <div className={styles.longProgressFill} style={{ width: `${progress}%` }}>
                            <div className={styles.longProgressThumb} />
                        </div>
                    </div>

                    <div className={styles.longControlsRow}>
                        <div className={styles.longControlsLeft}>
                            <button className={styles.longCtrlBtn} onClick={handleTogglePlay}>
                                {playing
                                    ? <Pause size={18} color="#fff" />
                                    : <Play size={18} color="#fff" fill="#fff" />
                                }
                            </button>
                            <button
                                className={styles.longCtrlBtn}
                                onClick={() => setMuted((m) => !m)}
                            >
                                {muted
                                    ? <VolumeX size={18} color="#fff" />
                                    : <Volume2 size={18} color="#fff" />
                                }
                            </button>
                            <span className={styles.longTimeLabel}>
                                {formatDuration(currentTime)} / {formatDuration(duration)}
                            </span>
                        </div>
                        <div className={styles.longControlsRight}>
                            <button className={styles.longCtrlBtn} onClick={handleFullscreen}>
                                <Maximize2 size={16} color="#fff" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Info row below video ── */}
            <div className={styles.longInfo}>
                {/* Author + meta */}
                <div className={styles.longAuthorRow}>
                    <div className={styles.longAvatarWrap}>
                        {author?.avatarUrl ? (
                            <img
                                src={author.avatarUrl}
                                alt={author.userName}
                                className={styles.longAvatar}
                            />
                        ) : (
                            <div className={styles.longAvatarPlaceholder}>{authorInitial}</div>
                        )}
                    </div>
                    <div className={styles.longAuthorMeta}>
                        <span className={styles.longAuthorName}>
                            {author?.userName ?? `user_${video.authorId}`}
                        </span>
                        <span className={styles.longPostTime}>{timeAgo(video.createdAt)}</span>
                    </div>
                    <button className={styles.longMoreBtn}>
                        <MoreHorizontal size={18} color="rgba(255,255,255,0.5)" />
                    </button>
                </div>

                {/* Caption */}
                {captionText && (
                    <div className={styles.longCaption}>
                        <span>
                            {(!shouldTruncate || captionExpanded)
                                ? captionText
                                : `${captionText.slice(0, 120)}… `
                            }
                        </span>
                        {shouldTruncate && (
                            <button
                                className={styles.longCaptionToggle}
                                onClick={() => setCaptionExpanded((v) => !v)}
                            >
                                {captionExpanded ? 'See less' : 'See more'}
                            </button>
                        )}
                    </div>
                )}

                {/* Tags */}
                {video.tags && video.tags.length > 0 && (
                    <div className={styles.longTags}>
                        {video.tags.map((t) => (
                            <span key={t.id} className={styles.longTag}>#{t.tag}</span>
                        ))}
                    </div>
                )}

                {/* Action bar */}
                <div className={styles.longActions}>
                    <button
                        className={`${styles.longActionBtn} ${isLiked ? styles.longActionBtnActive : ''} ${likeAnim ? styles.likeAnimate : ''}`}
                        onClick={handleLike}
                    >
                        <Heart
                            size={18}
                            color={isLiked ? '#ef4444' : 'rgba(255,255,255,0.7)'}
                            fill={isLiked ? '#ef4444' : 'none'}
                        />
                        <span>{formatCount(likeCount)}</span>
                    </button>

                    <button
                        className={styles.longActionBtn}
                        onClick={() => onOpenComments(video.id)}
                    >
                        <MessageCircle size={18} color="rgba(255,255,255,0.7)" />
                        <span>{formatCount(video.commentCount ?? 0)}</span>
                    </button>

                    <div className={styles.longActionBtn} style={{ cursor: 'default' }}>
                        <Eye size={18} color="rgba(255,255,255,0.5)" />
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {formatCount(video.viewCount ?? 0)}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default LongVideoCard;
