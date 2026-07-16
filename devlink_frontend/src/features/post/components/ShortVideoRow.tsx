import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Eye, Play, Volume2, VolumeX } from 'lucide-react';
import { reactionApi } from '../../../api/post-service/reactionApi';
import type { VideoFeedResponse } from '../../../types/video.types';
import type { ReactionResponse } from '../../../types/reaction.types';
import styles from './ShortVideoRow.module.css';

interface Props {
    videos: VideoFeedResponse[];
    onClickDetail: (videoId: number) => void;
}

const ShortVideoRow: React.FC<Props> = ({ videos, onClickDetail }) => {
    return (
        <div className={styles.gridWrapper}>
            {videos.map(video => (
                <ShortCard key={video.id} video={video} onClickDetail={onClickDetail} />
            ))}
        </div>
    );
};

/* ─── Individual Short Card ─── */

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

interface CardProps {
    video: VideoFeedResponse;
    onClickDetail: (videoId: number) => void;
}

const ShortCard: React.FC<CardProps> = ({ video, onClickDetail }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hovered, setHovered] = useState(false);
    const [muted, setMuted] = useState(true);
    const [likeAnim, setLikeAnim] = useState(false);
    const [reaction, setReaction] = useState<ReactionResponse | null>(null);
    const [liking, setLiking] = useState(false);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const videoUrl = video.mediaList?.find(m => m.mediaType === 'VIDEO')?.url ?? '';
    const thumbnailUrl = video.mediaList?.find(m => m.mediaType === 'IMAGE')?.url ?? '';
    const author = video.author;
    const authorInitial = author?.userName?.[0]?.toUpperCase() ?? '?';

    // Fetch reaction
    useEffect(() => {
        reactionApi.getSummary(video.id, 'POST')
            .then(r => setReaction(r.data.data))
            .catch(() => null);
    }, [video.id]);

    // Autoplay on hover (with 200ms delay to prevent flicker)
    const handleMouseEnter = useCallback(() => {
        hoverTimerRef.current = setTimeout(() => {
            setHovered(true);
            const vid = videoRef.current;
            if (vid && videoUrl) {
                vid.currentTime = 0;
                vid.play().catch(() => {});
            }
        }, 200);
    }, [videoUrl]);

    const handleMouseLeave = useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setHovered(false);
        const vid = videoRef.current;
        if (vid) {
            vid.pause();
            vid.currentTime = 0;
        }
    }, []);

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

    const handleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMuted(m => !m);
    };

    const isLiked = reaction?.currentUserReaction === 'LIKE';
    const likeCount = reaction?.totalCount ?? video.likeCount ?? 0;

    return (
        <div
            className={`${styles.card} ${hovered ? styles.cardHovered : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => onClickDetail(video.id)}
        >
            {/* Thumbnail / Video */}
            <div className={styles.mediaWrap}>
                {/* Thumbnail shown when not hovering */}
                {thumbnailUrl && !hovered && (
                    <img src={thumbnailUrl} alt="" className={styles.thumbnail} />
                )}

                {/* Static preview frame when no thumbnail */}
                {!thumbnailUrl && !hovered && (
                    <div className={styles.noThumb}>
                        <Play size={28} color="rgba(255,255,255,0.5)" fill="rgba(255,255,255,0.5)" />
                    </div>
                )}

                {/* Video element (always mounted but plays only on hover) */}
                <video
                    ref={videoRef}
                    src={videoUrl || undefined}
                    className={`${styles.video} ${hovered ? styles.videoVisible : ''}`}
                    loop
                    muted={muted}
                    playsInline
                    preload="metadata"
                />

                {/* Hover controls */}
                {hovered && (
                    <div className={styles.hoverControls}>
                        <button
                            className={styles.muteBtn}
                            onClick={handleMute}
                            title={muted ? 'Bật âm' : 'Tắt âm'}
                        >
                            {muted
                                ? <VolumeX size={14} color="#fff" />
                                : <Volume2 size={14} color="#fff" />
                            }
                        </button>
                    </div>
                )}

                {/* Play icon on idle */}
                {!hovered && (
                    <div className={styles.playOverlay}>
                        <Play size={20} color="#fff" fill="#fff" />
                    </div>
                )}

                {/* Gradient overlay */}
                <div className={styles.gradientOverlay} />

                {/* Bottom meta: author + view count */}
                <div className={styles.bottomMeta}>
                    <div className={styles.authorRow}>
                        {author?.avatarUrl ? (
                            <img src={author.avatarUrl} alt="" className={styles.smallAvatar} />
                        ) : (
                            <div className={styles.smallAvatarPlaceholder}>{authorInitial}</div>
                        )}
                        <span className={styles.authorName}>
                            {author?.userName ?? `user_${video.authorId}`}
                        </span>
                    </div>
                    <div className={styles.viewRow}>
                        <Eye size={12} color="rgba(255,255,255,0.7)" />
                        <span>{formatCount(video.viewCount ?? 0)}</span>
                    </div>
                </div>
            </div>

            {/* Caption */}
            {video.content && (
                <div className={styles.caption}>
                    {video.content.length > 60 ? video.content.slice(0, 60) + '…' : video.content}
                </div>
            )}

            {/* Action row */}
            <div className={styles.actions}>
                <button
                    className={`${styles.actionBtn} ${isLiked ? styles.actionBtnLiked : ''} ${likeAnim ? styles.likeAnim : ''}`}
                    onClick={handleLike}
                >
                    <Heart size={15} color={isLiked ? '#ef4444' : undefined} fill={isLiked ? '#ef4444' : 'none'} />
                    <span>{formatCount(likeCount)}</span>
                </button>

                <button className={styles.actionBtn} onClick={e => { e.stopPropagation(); onClickDetail(video.id); }}>
                    <MessageCircle size={15} />
                    <span>{formatCount(video.commentCount ?? 0)}</span>
                </button>
            </div>
        </div>
    );
};

export default ShortVideoRow;
