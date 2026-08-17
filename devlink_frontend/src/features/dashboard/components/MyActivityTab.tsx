import { useState, useEffect, useRef } from 'react';
import { postApi } from '../../../api/post-service/postApi';
import { overviewPostApi } from '../../../api/post-service/overviewPostApi';
import ImagePreviewModal from '../../../components/common/ImagePreviewModal/ImagePreviewModal';
import PostCard from '../../post/components/PostCard';
import type { FeedPostResponse } from '../../../types/post.types';
import styles from '../pages/UserDashboardPage/UserDashboardPage.module.css';

const REACTION_ICONS: Record<string, React.ReactNode> = {
    LIKE: <svg viewBox="0 0 24 24" width="24" height="24" fill="#2563EB"><path d="M2 10h4v10H2v-10zm20 2c0-1.1-.9-2-2-2h-5.3l.8-3.9v-.4c0-.4-.1-.8-.4-1l-1-1-4.7 4.8c-.3.3-.5.7-.5 1.1v8c0 1.1.9 2 2 2h6.5c.8 0 1.5-.5 1.8-1.2l3-7c.1-.2.2-.5.2-.8v-1.6z" /></svg>,
    LOVE: <svg viewBox="0 0 24 24" width="24" height="24" fill="#EF4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>,
    HAHA: <svg viewBox="0 0 24 24" width="24" height="24" fill="#F59E0B"><circle cx="12" cy="12" r="10" /><path fill="#fff" d="M12 16.5c-2.3 0-4.3-1.4-5.2-3.5h10.4c-.9 2.1-2.9 3.5-5.2 3.5z" /><circle fill="#fff" cx="8.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="15.5" cy="9.5" r="1.5" /></svg>,
    WOW:  <svg viewBox="0 0 24 24" width="24" height="24" fill="#F59E0B"><circle cx="12" cy="12" r="10" /><circle fill="#fff" cx="8.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="15.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="12" cy="16" r="2.5" /></svg>,
    SAD:  <svg viewBox="0 0 24 24" width="24" height="24" fill="#F59E0B"><circle cx="12" cy="12" r="10" /><path fill="#fff" d="M12 13.5c-2 0-3.8 1.1-4.7 2.8l1.7.9c.6-1 1.6-1.7 3-1.7s2.4.7 3 1.7l1.7-.9c-.9-1.7-2.7-2.8-4.7-2.8z" /><circle fill="#fff" cx="8.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="15.5" cy="9.5" r="1.5" /></svg>,
    ANGRY:<svg viewBox="0 0 24 24" width="24" height="24" fill="#EA580C"><circle cx="12" cy="12" r="10" /><path fill="#fff" d="M8.5 11c.8 0 1.5-.7 1.5-1.5S9.3 8 8.5 8 7 8.7 7 9.5 7.7 11 8.5 11zm7 0c.8 0 1.5-.7 1.5-1.5S16.3 8 15.5 8 14 8.7 14 9.5 14.7 11 15.5 11zm-3.5 3c-2.3 0-4.3 1.4-5.2 3.5h10.4c-.9-2.1-2.9-3.5-5.2-3.5z" /><path stroke="#fff" strokeWidth="2" strokeLinecap="round" d="M6 7l3 1.5M18 7l-3 1.5" /></svg>,
};

function formatDate(dateString: string) {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString));
}

export default function MyActivityTab() {
    const [history, setHistory]     = useState<any[]>([]);
    const [loading, setLoading]     = useState(false);
    const [hasMore, setHasMore]     = useState(true);
    const [, setPage]               = useState(0);
    const loaderRef                 = useRef<HTMLDivElement | null>(null);

    const [previewImages, setPreviewImages]   = useState<string[]>([]);
    const [isPreviewOpen, setIsPreviewOpen]   = useState(false);
    const [viewingPostData, setViewingPostData] = useState<FeedPostResponse | null>(null);

    const fetchHistory = async (pageNumber: number, reset = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await overviewPostApi.getReactHistory(pageNumber, 10);
            if (res.data.success) {
                const items = res.data.data.content;
                setHistory(prev => reset ? items : [...prev, ...items]);
                setHasMore(!res.data.data.last);
            }
        } catch (err) {
            console.error('Failed to fetch react history:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setHistory([]); setPage(0); setHasMore(true);
        fetchHistory(0, true);
    }, []);

    useEffect(() => {
        if (!loaderRef.current) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                setPage(prev => { const next = prev + 1; fetchHistory(next); return next; });
            }
        }, { threshold: 0.5 });
        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    return (
        <div className={styles.activityScrollArea}>
            <div className={styles.activityColHeader}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                Liked Posts
            </div>

            {!loading && history.length === 0 ? (
                <div className={styles.colEmpty}>
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
                    </svg>
                    <p>No activity yet. Start reacting to posts!</p>
                </div>
            ) : (
                <div className={styles.activityGrid}>
                    {history.map(item => (
                        <div key={item.reactId} className={styles.activityCard}>
                            <div className={styles.activityCardHeader}>
                                <div className={styles.avatarStack}>
                                    {item.groupId ? (
                                        <>
                                            <img src={item.groupImage || '/default-group.png'} alt={item.groupName}
                                                className={styles.groupAvatarStack}
                                                onClick={() => window.open(`/groups/${item.groupId}`, '_blank')}
                                                title={item.groupName}
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            <img src={item.authorAvatarUrl || '/default-avatar.png'} alt={item.authorName}
                                                className={styles.userAvatarStackOverlap}
                                                onClick={() => window.open(`/profile/${item.authorId}`, '_blank')}
                                                title={item.authorName}
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        </>
                                    ) : (
                                        <img src={item.authorAvatarUrl || '/default-avatar.png'} alt={item.authorName}
                                            className={styles.userAvatarStackSingle}
                                            onClick={() => window.open(`/profile/${item.authorId}`, '_blank')}
                                            title={item.authorName}
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    )}
                                </div>

                                <div className={styles.headerInfo}>
                                    <div className={styles.headerName}>
                                        <span className={styles.headerAuthorName}
                                            onClick={() => window.open(`/profile/${item.authorId}`, '_blank')}>
                                            {item.authorName}
                                        </span>
                                        {item.groupId && (
                                            <>
                                                <span className={styles.headerNameSeparator}> ▶ </span>
                                                <span className={styles.headerGroupName}
                                                    onClick={() => window.open(`/groups/${item.groupId}`, '_blank')}>
                                                    {item.groupName}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className={styles.headerDate}>{formatDate(item.createdAt)}</div>
                                </div>

                                <div className={styles.headerActions}>
                                    <span className={styles.activityReactionIcon}>
                                        {REACTION_ICONS[item.reactionType] || item.reactionType}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.activityCardBody}>
                                <p className={styles.activityCardContent}>
                                    {item.postContent || <span className={styles.activityMediaOnly}>Media post</span>}
                                </p>
                            </div>

                            {item.files && item.files.length > 0 && (
                                <div className={styles.activityCardImageFull}>
                                    <img src={item.files[0].url} alt="post thumbnail"
                                        className={styles.activityImageUncropped}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => { setPreviewImages(item.files.map((f: any) => f.url)); setIsPreviewOpen(true); }}
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                </div>
                            )}

                            <div className={styles.activityCardFooter}>
                                <button className={styles.activityViewBtn} title="View post"
                                    onClick={async () => {
                                        try {
                                            const res = await postApi.getPostById(item.postId);
                                            if (res.data?.data) setViewingPostData(res.data.data);
                                        } catch (err) { console.error(err); }
                                    }}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                    </svg>
                                    View Post
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div ref={loaderRef} className={styles.scrollLoader}>
                {loading && <span className={styles.scrollLoaderText}>Loading more...</span>}
                {!hasMore && history.length > 0 && <span className={styles.scrollEndText}>You've reached the end</span>}
            </div>

            {isPreviewOpen && (
                <ImagePreviewModal images={previewImages} currentIndex={0}
                    isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
            )}

            {viewingPostData && (
                <div className={styles.postOverlayOverlay}>
                    <div className={styles.postOverlayContent}>
                        <button className={styles.postOverlayClose} onClick={() => setViewingPostData(null)}>✕</button>
                        <div className={styles.postOverlayScroll}>
                            <PostCard post={viewingPostData}
                                onDeleted={() => setViewingPostData(null)}
                                onUpdated={updated => setViewingPostData(updated)}
                                openCommentPostId={viewingPostData.id}
                                onToggleComment={() => {}} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
