import { useState, useEffect, useRef } from 'react';
import { postApi } from '../../../api/post-service/postApi';
import { overviewPostApi } from '../../../api/post-service/overviewPostApi';
import PostCard from '../../post/components/PostCard';
import type { FeedPostResponse } from '../../../types/post.types';
import styles from '../pages/UserDashboardPage/UserDashboardPage.module.css';

function formatDate(dateString: string) {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString));
}

export default function CommentReplyHistoryTab() {
    const [replies, setReplies]     = useState<any[]>([]);
    const [loading, setLoading]     = useState(false);
    const [hasMore, setHasMore]     = useState(true);
    const [, setPage]               = useState(0);
    const loaderRef                 = useRef<HTMLDivElement | null>(null);

    const [viewingPostData, setViewingPostData] = useState<FeedPostResponse | null>(null);

    const fetchReplies = async (pageNumber: number, reset = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await overviewPostApi.getCommentReplyHistory(pageNumber, 10);
            if (res.data.success) {
                const items = res.data.data.content;
                setReplies(prev => reset ? items : [...prev, ...items]);
                setHasMore(!res.data.data.last);
            }
        } catch (err) {
            console.error('Failed to fetch comment reply history:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setReplies([]); setPage(0); setHasMore(true);
        fetchReplies(0, true);
    }, []);

    useEffect(() => {
        if (!loaderRef.current) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                setPage(prev => { const next = prev + 1; fetchReplies(next); return next; });
            }
        }, { threshold: 0.5 });
        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    return (
        <div className={styles.activityScrollArea}>
            <div className={styles.activityColHeader}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Replies to My Comments
            </div>

            {!loading && replies.length === 0 ? (
                <div className={styles.colEmpty}>
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p>No replies to your comments yet.</p>
                </div>
            ) : (
                <div className={styles.activityGrid}>
                    {replies.map(item => (
                        <div key={item.replyId} className={styles.activityCard}>
                            <div className={styles.activityCardHeader}>
                                <div className={styles.avatarStack}>
                                    {item.groupId ? (
                                        <>
                                            <img src={item.groupImage || '/default-group.png'} alt={item.groupName}
                                                className={styles.groupAvatarStack}
                                                onClick={() => window.open(`/groups/${item.groupId}`, '_blank')}
                                                title={item.groupName}
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            <img src={item.replierAvatarUrl || '/default-avatar.png'} alt={item.replierName}
                                                className={styles.userAvatarStackOverlap}
                                                onClick={() => window.open(`/profile/${item.replierId}`, '_blank')}
                                                title={item.replierName}
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        </>
                                    ) : (
                                        <img src={item.replierAvatarUrl || '/default-avatar.png'} alt={item.replierName}
                                            className={styles.userAvatarStackSingle}
                                            onClick={() => window.open(`/profile/${item.replierId}`, '_blank')}
                                            title={item.replierName}
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    )}
                                </div>

                                <div className={styles.headerInfo}>
                                    <div className={styles.headerName}>
                                        <span className={styles.headerAuthorName}
                                            onClick={() => window.open(`/profile/${item.replierId}`, '_blank')}>
                                            {item.replierName}
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
                                    <div className={styles.headerDate}>{formatDate(item.repliedAt)}</div>
                                </div>

                                </div>

                                <div className={styles.activityCardBody}>
                                    <p className={styles.activityCardContent} style={{ marginBottom: '8px' }}>
                                        {item.replyContent}
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#6b7280', borderLeft: '2px solid #e5e7eb', paddingLeft: '8px' }}>
                                        <p style={{ margin: 0 }}>
                                            <strong style={{ fontWeight: 500, color: '#4b5563' }}>Your comment: </strong> 
                                            {item.commentContent}
                                        </p>
                                        <p style={{ margin: 0 }}>
                                            <strong style={{ fontWeight: 500, color: '#4b5563' }}>In post: </strong> 
                                            {item.postContent || <span style={{ fontStyle: 'italic' }}>Media post</span>}
                                        </p>
                                    </div>
                                </div>

                            {item.files && item.files.length > 0 && (
                                <div className={styles.activityCardImageFull}>
                                    <img src={item.files[0].url} alt="post thumbnail"
                                        className={styles.activityImageUncropped}
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
                {!hasMore && replies.length > 0 && <span className={styles.scrollEndText}>You've reached the end</span>}
            </div>

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
