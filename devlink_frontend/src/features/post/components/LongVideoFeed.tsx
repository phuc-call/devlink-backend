import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    Heart, MessageCircle, Eye, Volume2, VolumeX,
    Play, Pause, Maximize2, ExternalLink,
} from 'lucide-react';
import { reactionApi } from '../../../api/post-service/reactionApi';
import type { VideoFeedResponse } from '../../../types/video.types';
import type { ReactionResponse } from '../../../types/reaction.types';
import styles from './LongVideoFeed.module.css';

interface Props {
    video: VideoFeedResponse;
    onClickDetail: (videoId: number) => void;
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
    if (m < 1) return 'vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} ngày trước`;
    return `${Math.floor(d / 30)} tháng trước`;
}

const LongVideoFeed: React.FC<Props> = ({ video, onClickDetail }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [showControls, setShowControls] = useState(false);
    const [captionExpanded, setCaptionExpanded] = useState(false);
    const [likeAnim, setLikeAnim] = useState(false);
    const [reaction, setReaction] = useState<ReactionResponse | null>(null);
    const [liking, setLiking] = useState(false);
    const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const videoUrl = video.mediaList?.find(m => m.mediaType === 'VIDEO')?.url ?? '';
    const thumbnailUrl = video.mediaList?.find(m => m.mediaType === 'IMAGE')?.url ?? '';
    const author = video.author;
    const authorInitial = author?.userName?.[0]?.toUpperCase() ?? '?';
    const captionText = video.content ?? '';
    const shouldTruncate = captionText.length > 150;

    // Fetch reaction on mount
    useEffect(() => {
        reactionApi.getSummary(video.id, 'POST')
            .then(r => setReaction(r.data.data))
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

    const showControlsFor3s = useCallback(() => {
        setShowControls(true);
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }, []);

    const handleTogglePlay = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const vid = videoRef.current;
        if (!vid) return;
        if (vid.paused) {
            vid.play(); setPlaying(true);
        } else {
            vid.pause(); setPlaying(false);
        }
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
        if (vid) setDuration(vid.duration);
    };

    const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const vid = videoRef.current;
        if (!vid) return;
        const rect = e.currentTarget.getBoundingClientRect();
        vid.currentTime = ((e.clientX - rect.left) / rect.width) * vid.duration;
        showControlsFor3s();
    };

    const handleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const vid = videoRef.current;
        if (!vid) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else vid.requestFullscreen?.();
    };

    const handleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMuted(m => !m);
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (liking) return;
        setLiking(true); setLikeAnim(true);
        setTimeout(() => setLikeAnim(false), 400);
        try {
            await reactionApi.react({ targetId: video.id, targetType: 'POST', reactionType: 'LIKE' });
            const r = await reactionApi.getSummary(video.id, 'POST');
            setReaction(r.data.data);
        } catch { /* ignore */ }
        finally { setLiking(false); }
    };

    const isLiked = reaction?.currentUserReaction === 'LIKE';
    const likeCount = reaction?.totalCount ?? video.likeCount ?? 0;

    return (
        <article className={styles.card} ref={containerRef}>
            {/* ── Author header ── */}
            <div className={styles.header}>
                <div className={styles.avatarWrap}>
                    {author?.avatarUrl ? (
                        <img src={author.avatarUrl} alt={author.userName} className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>{authorInitial}</div>
                    )}
                </div>
                <div className={styles.authorMeta}>
                    <span className={styles.authorName}>{author?.userName ?? `user_${video.authorId}`}</span>
                    <span className={styles.postTime}>{timeAgo(video.createdAt)}</span>
                </div>
                {video.feedBucket && (
                    <span className={`${styles.bucketBadge} ${video.feedBucket === 'PRIORITY' ? styles.priority : styles.discovery}`}>
                        {video.feedBucket === 'PRIORITY' ? '⚡ Priority' : '🔍 Discovery'}
                    </span>
                )}
                {/* Click to see detail */}
                <button
                    className={styles.detailBtn}
                    onClick={() => onClickDetail(video.id)}
                    title="Xem chi tiết"
                >
                    <ExternalLink size={16} />
                </button>
            </div>

            {/* ── Caption ── */}
            {captionText && (
                <div className={styles.caption}>
                    <span>
                        {(!shouldTruncate || captionExpanded)
                            ? captionText
                            : `${captionText.slice(0, 150)}… `}
                    </span>
                    {shouldTruncate && (
                        <button className={styles.captionToggle} onClick={() => setCaptionExpanded(v => !v)}>
                            {captionExpanded ? 'Thu gọn' : 'Xem thêm'}
                        </button>
                    )}
                </div>
            )}

            {/* ── Tags ── */}
            {video.tags && video.tags.length > 0 && (
                <div className={styles.tags}>
                    {video.tags.map(t => (
                        <span key={t.id} className={styles.tag}>#{t.tag}</span>
                    ))}
                </div>
            )}

            {/* ── Video Player ── */}
            <div
                className={styles.playerWrap}
                onMouseMove={showControlsFor3s}
                onMouseLeave={() => setShowControls(false)}
                onClick={() => onClickDetail(video.id)}
            >
                {videoUrl ? (
                    <>
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            poster={thumbnailUrl || undefined}
                            className={styles.video}
                            loop
                            muted={muted}
                            playsInline
                            onTimeUpdate={onTimeUpdate}
                            onLoadedMetadata={onLoadedMetadata}
                            onClick={handleTogglePlay}
                        />

                        {/* Overlay controls */}
                        <div className={`${styles.overlay} ${showControls || !playing ? styles.overlayVisible : ''}`}>
                            {/* Center play/pause */}
                            <button className={styles.centerPlayBtn} onClick={handleTogglePlay}>
                                {playing ? <Pause size={28} color="#fff" /> : <Play size={28} color="#fff" fill="#fff" />}
                            </button>

                            {/* Bottom bar */}
                            <div className={styles.bottomBar}>
                                {/* Seek bar */}
                                <div className={styles.seekBar} onClick={onSeek}>
                                    <div className={styles.seekFill} style={{ width: `${progress}%` }}>
                                        <div className={styles.seekThumb} />
                                    </div>
                                </div>
                                {/* Controls row */}
                                <div className={styles.controlsRow}>
                                    <div className={styles.controlsLeft}>
                                        <button className={styles.ctrlBtn} onClick={handleTogglePlay}>
                                            {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" fill="#fff" />}
                                        </button>
                                        <button className={styles.ctrlBtn} onClick={handleMute}>
                                            {muted ? <VolumeX size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
                                        </button>
                                        <span className={styles.timeLabel}>
                                            {formatDuration(currentTime)} / {formatDuration(duration)}
                                        </span>
                                    </div>
                                    <div className={styles.controlsRight}>
                                        <button className={styles.ctrlBtn} onClick={handleFullscreen}>
                                            <Maximize2 size={14} color="#fff" />
                                        </button>
                                        <button
                                            className={styles.ctrlBtn}
                                            onClick={e => { e.stopPropagation(); onClickDetail(video.id); }}
                                            title="Xem chi tiết"
                                        >
                                            <ExternalLink size={14} color="#fff" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mute indicator */}
                        {muted && (
                            <div className={styles.mutedBadge} onClick={handleMute}>
                                <VolumeX size={14} color="#fff" /> Nhấn để bật âm
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles.noVideo}>
                        <Play size={32} color="rgba(255,255,255,0.2)" />
                        <span>Không có video</span>
                    </div>
                )}
            </div>

            {/* ── Action bar ── */}
            <div className={styles.actions}>
                <button
                    className={`${styles.actionBtn} ${isLiked ? styles.actionBtnLiked : ''} ${likeAnim ? styles.likeAnim : ''}`}
                    onClick={handleLike}
                >
                    <Heart size={18} color={isLiked ? '#ef4444' : undefined} fill={isLiked ? '#ef4444' : 'none'} />
                    <span>{formatCount(likeCount)}</span>
                </button>

                <button className={styles.actionBtn} onClick={() => onClickDetail(video.id)}>
                    <MessageCircle size={18} />
                    <span>{formatCount(video.commentCount ?? 0)}</span>
                </button>

                <div className={`${styles.actionBtn} ${styles.actionBtnStatic}`}>
                    <Eye size={18} />
                    <span>{formatCount(video.viewCount ?? 0)}</span>
                </div>
            </div>
        </article>
    );
};

export default LongVideoFeed;
