import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, Eye, Play, Volume2, VolumeX, MessageCircle } from 'lucide-react';
import { reactionApi } from '../../../api/post-service/reactionApi';
import type { VideoFeedResponse } from '../../../types/video.types';
import type { ReactionResponse } from '../../../types/reaction.types';
import styles from './ShortVideoCard.module.css';

interface Props {
    video: VideoFeedResponse;
    onClickDetail: (videoId: number) => void;
}

function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

const ShortVideoCard: React.FC<Props> = ({ video, onClickDetail }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [hovered, setHovered] = useState(false);
    const [muted, setMuted] = useState(true);
    const [likeAnim, setLikeAnim] = useState(false);
    const [reaction, setReaction] = useState<ReactionResponse | null>(null);
    const [liking, setLiking] = useState(false);

    const videoUrl = video.mediaList?.find(m => m.mediaType === 'VIDEO')?.url ?? '';
    const thumbUrl = video.mediaList?.find(m => m.mediaType === 'IMAGE')?.url ?? '';
    const author = video.author;
    const authorInitial = author?.fullName?.[0]?.toUpperCase() ?? '?';

    useEffect(() => {
        reactionApi.getSummary(video.id, 'POST')
            .then(r => setReaction(r.data.data))
            .catch(() => null);
    }, [video.id]);

    // Hover → autoplay after short delay
    const onMouseEnter = useCallback(() => {
        hoverTimer.current = setTimeout(() => {
            setHovered(true);
            const vid = videoRef.current;
            if (vid && videoUrl) {
                vid.currentTime = 0;
                vid.play().catch(() => {});
            }
        }, 150);
    }, [videoUrl]);

    const onMouseLeave = useCallback(() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setHovered(false);
        const vid = videoRef.current;
        if (vid) { vid.pause(); vid.currentTime = 0; }
    }, []);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (liking) return;
        setLiking(true);
        setLikeAnim(true);
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
            className={styles.card}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={() => onClickDetail(video.id)}
        >
            {/* Thumbnail */}
            {thumbUrl && !hovered && (
                <img src={thumbUrl} alt="" className={styles.thumbnail} />
            )}
            {!thumbUrl && !hovered && (
                <div className={styles.noThumb}>
                    <Play size={28} color="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.4)" />
                </div>
            )}

            {/* Video (always mounted, visible only on hover) */}
            <video
                ref={videoRef}
                src={videoUrl || undefined}
                className={`${styles.video} ${hovered ? styles.videoVisible : ''}`}
                loop
                muted={muted}
                playsInline
                preload="metadata"
            />

            {/* Gradient overlay */}
            <div className={styles.gradient} />

            {/* Play icon when idle */}
            {!hovered && (
                <div className={styles.playOverlay}>
                    <Play size={18} color="#fff" fill="#fff" />
                </div>
            )}

            {/* Mute button (visible on hover) */}
            {hovered && (
                <div className={styles.topControls}>
                    <button className={styles.iconBtn} onClick={handleMute} title={muted ? 'Bật âm' : 'Tắt âm'}>
                        {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                </div>
            )}

            {/* Bottom info */}
            <div className={styles.bottomInfo}>
                <div className={styles.authorRow}>
                    {author?.avatarUrl
                        ? <img src={author.avatarUrl} alt="" className={styles.avatar} />
                        : <div className={styles.avatarPlaceholder}>{authorInitial}</div>
                    }
                    <span className={styles.authorName}>{author?.fullName ?? `user_${video.authorId}`}</span>
                </div>

                <div className={styles.statsRow}>
                    {/* Like */}
                    <button
                        className={`${styles.likeBtn} ${isLiked ? styles.likeBtnActive : ''} ${likeAnim ? styles.likeAnim : ''}`}
                        onClick={handleLike}
                    >
                        <Heart
                            size={13}
                            color={isLiked ? '#ef4444' : 'rgba(255,255,255,0.85)'}
                            fill={isLiked ? '#ef4444' : 'none'}
                        />
                        <span>{fmt(likeCount)}</span>
                    </button>

                    {/* Comment */}
                    <button
                        className={styles.likeBtn}
                        onClick={e => { e.stopPropagation(); onClickDetail(video.id); }}
                    >
                        <MessageCircle size={13} color="rgba(255,255,255,0.85)" />
                        <span>{fmt(video.commentCount ?? 0)}</span>
                    </button>

                    {/* Views */}
                    <div className={styles.stat}>
                        <Eye size={12} color="rgba(255,255,255,0.7)" />
                        <span>{fmt(video.viewCount ?? 0)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShortVideoCard;
