import React, {
    useRef, useState, useEffect, useCallback,
} from 'react';
import { Heart, MessageCircle, Eye, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { reactionApi } from '../../../api/post-service/reactionApi';
import type { VideoFeedResponse } from '../../../types/video.types';
import type { ReactionResponse } from '../../../types/reaction.types';
import styles from './CommentDrawer.module.css'; // placeholder — component not actively used


interface Props {
    video: VideoFeedResponse;
    isActive: boolean;             // true when this slide is in viewport
    onOpenComments: (videoId: number) => void;
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

const VideoCard: React.FC<Props> = ({ video, isActive, onOpenComments }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showPause, setShowPause] = useState(false);
    const [captionExpanded, setCaptionExpanded] = useState(false);
    const [likeAnim, setLikeAnim] = useState(false);

    // Reaction state
    const [reaction, setReaction] = useState<ReactionResponse | null>(null);
    const [liking, setLiking] = useState(false);

    const videoUrl =
        video.mediaList?.find((m) => m.mediaType === 'VIDEO')?.url ?? '';

    // Auto-play / pause when slide enters/leaves viewport
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid || !videoUrl) return;
        if (isActive) {
            vid.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        } else {
            vid.pause();
            vid.currentTime = 0;
            setPlaying(false);
            setProgress(0);
        }
    }, [isActive, videoUrl]);

    // Fetch reaction summary on mount
    useEffect(() => {
        reactionApi
            .getSummary(video.id, 'POST')
            .then((r) => setReaction(r.data.data))
            .catch(() => null);
    }, [video.id]);

    // Progress bar
    const onTimeUpdate = () => {
        const vid = videoRef.current;
        if (vid && vid.duration) {
            setProgress((vid.currentTime / vid.duration) * 100);
        }
    };

    const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const vid = videoRef.current;
        if (!vid) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        vid.currentTime = pct * vid.duration;
    };

    // Toggle play
    const handleTap = useCallback(() => {
        const vid = videoRef.current;
        if (!vid) return;
        if (vid.paused) {
            vid.play();
            setPlaying(true);
        } else {
            vid.pause();
            setPlaying(false);
            setShowPause(true);
            setTimeout(() => setShowPause(false), 700);
        }
    }, []);

    // Like
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
            // Re-fetch summary
            const r = await reactionApi.getSummary(video.id, 'POST');
            setReaction(r.data.data);
        } catch {
            /* ignore */
        } finally {
            setLiking(false);
        }
    };

    const isLiked = reaction?.currentUserReaction === 'LIKE';
    const likeCount = reaction?.totalCount ?? video.likeCount ?? 0;

    const author = video.author;
    const authorInitial = author?.fullName?.[0]?.toUpperCase() ?? '?';

    return (
        <div className={styles.slide}>
            {/* Gradient overlays */}
            <div className={styles.gradientTop} />
            <div className={styles.gradientBottom} />

            {/* Bucket badge */}
            {video.feedBucket && (
                <div
                    className={`${styles.bucketBadge} ${
                        video.feedBucket === 'PRIORITY' ? styles.bucketPriority : styles.bucketDiscovery
                    }`}
                >
                    {video.feedBucket === 'PRIORITY' ? '⚡ Priority' : '🔍 Discovery'}
                </div>
            )}

            {/* Mute button */}
            <button
                className={styles.muteBtn}
                onClick={() => setMuted((m) => !m)}
                title={muted ? 'Unmute' : 'Mute'}
            >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Video */}
            <video
                ref={videoRef}
                src={videoUrl}
                className={styles.video}
                loop
                muted={muted}
                playsInline
                onTimeUpdate={onTimeUpdate}
                onClick={handleTap}
            />

            {/* Pause icon flash */}
            <div className={`${styles.pauseIcon} ${showPause ? styles.pauseIconVisible : ''}`}>
                {playing ? <Pause size={30} color="#fff" /> : <Play size={30} color="#fff" />}
            </div>

            {/* Progress bar */}
            <div className={styles.progressBar} onClick={onSeek}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>

            {/* ── Right sidebar actions ── */}
            <div className={styles.sidebar}>
                {/* Author avatar */}
                <div className={styles.avatarWrap}>
                    {author?.avatarUrl ? (
                        <img src={author.avatarUrl} alt={author.fullName} className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>{authorInitial}</div>
                    )}
                </div>

                {/* Like */}
                <div
                    className={styles.actionBtn}
                    onClick={handleLike}
                    title="Like"
                >
                    <div
                        className={`${styles.actionIconWrap} ${isLiked ? styles.actionIconWrapActive : ''} ${likeAnim ? styles.likeAnimate : ''}`}
                    >
                        <Heart
                            size={22}
                            color={isLiked ? '#ef4444' : '#fff'}
                            fill={isLiked ? '#ef4444' : 'none'}
                        />
                    </div>
                    <span className={styles.actionCount}>{formatCount(likeCount)}</span>
                </div>

                {/* Comment */}
                <div
                    className={styles.actionBtn}
                    onClick={() => onOpenComments(video.id)}
                    title="Comments"
                >
                    <div className={styles.actionIconWrap}>
                        <MessageCircle size={22} color="#fff" />
                    </div>
                    <span className={styles.actionCount}>
                        {formatCount(video.commentCount ?? 0)}
                    </span>
                </div>

                {/* View count */}
                <div className={styles.actionBtn} title="Views">
                    <div className={styles.actionIconWrap}>
                        <Eye size={22} color="#fff" />
                    </div>
                    <span className={styles.actionCount}>
                        {formatCount(video.viewCount ?? 0)}
                    </span>
                </div>
            </div>

            {/* ── Bottom meta ── */}
            <div className={styles.meta}>
                <div className={styles.authorName}>
                    @{author?.fullName ?? `user_${video.authorId}`}
                </div>
                {video.content && (
                    <div
                        className={`${styles.caption} ${captionExpanded ? styles.captionExpanded : ''}`}
                        onClick={() => setCaptionExpanded((v) => !v)}
                    >
                        {video.content}
                    </div>
                )}
                {video.tags && video.tags.length > 0 && (
                    <div className={styles.tags}>
                        {video.tags.map((t) => (
                            <span key={t.id} className={styles.tag}>
                                #{t.tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoCard;
