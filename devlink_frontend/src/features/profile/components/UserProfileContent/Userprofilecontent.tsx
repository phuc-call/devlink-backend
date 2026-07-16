import { useCallback, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { UserProfileResponse } from '../../../../types/profile.types';
import type { FeedPostResponse } from '../../../../types/post.types';
import { postApi } from '../../../../api/post-service/postApi';
import PostCard from '../../../post/components/PostCard';
import styles from './UserProfileContent.module.css';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';

interface Props {
    profile: UserProfileResponse | null;
}

export default function UserProfileContent({ profile }: Props) {
    const [posts, setPosts] = useState<FeedPostResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [openCommentPostId, setOpenCommentPostId] = useState<number | null>(null);
    const loadingRef = useRef(false);

    // Dùng field `limited` do backend trả về — không đoán bằng heuristic
    const isLimited = profile?.limited === true;
    const isPrivate = profile?.profileVisibility === 'PRIVATE';
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const postId = params.get('postId');
        const commentId = params.get('commentId');
        if (postId && posts.length > 0) {
            setTimeout(() => {
                const el = document.getElementById(`post-${postId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.transition = 'box-shadow 0.3s ease-in-out';
                    el.style.boxShadow = '0 0 0 2px #3B82F6';
                    setTimeout(() => {
                        el.style.boxShadow = 'none';
                    }, 3000);
                    
                    if (commentId) {
                        setOpenCommentPostId(Number(postId));
                        setTimeout(() => {
                            const commentEl = document.getElementById(`comment-${commentId}`) || document.getElementById(`reply-${commentId}`);
                            if (commentEl) {
                                commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                commentEl.style.transition = 'background-color 0.3s ease-in-out';
                                commentEl.style.backgroundColor = '#EEF2FF';
                                setTimeout(() => {
                                    commentEl.style.backgroundColor = 'transparent';
                                }, 3000);
                            }
                        }, 1200); // Give time for comments to load
                    }
                }
            }, 500); // Wait a bit for render
        }
    }, [location.search, posts.length]);

    const loadPosts = useCallback((pageNum: number, reset = false) => {
        if (loadingRef.current || !profile || isLimited) {
            setInitialLoading(false);
            return;
        }
        loadingRef.current = true;
        setLoading(true);

        postApi.getUserPosts(profile.userId, pageNum, 10)
            .then(res => {
                const data = res.data.data;
                setPosts(prev => (reset ? data.content : [...prev, ...data.content]));
                setHasMore(!data.last);
                setPage(pageNum);
            })
            .catch(err => {
                console.error('Lỗi tải bài viết user:', err);
                setPosts([]);
                setHasMore(false);
            })
            .finally(() => {
                loadingRef.current = false;
                setLoading(false);
                setInitialLoading(false);
            });
    }, [profile, isLimited]);

    useEffect(() => {
        if (profile) {
            loadPosts(0, true);
        }
    }, [profile, loadPosts]);

    const handleLoadMore = useCallback(() => {
        if (!isLimited) {
            loadPosts(page + 1);
        }
    }, [page, loadPosts, isLimited]);

    const triggerRef = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasMore,
        isLoading: loading,
    });

    const handlePostDeleted = useCallback((deletedId: number) => {
        setPosts(prev => prev.filter(p => p.id !== deletedId));
    }, []);

    const handlePostUpdated = useCallback((updated: FeedPostResponse) => {
        setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    }, []);

    const handleToggleComment = useCallback((postId: number | null) => {
        setOpenCommentPostId(prev => (prev === postId ? null : postId));
    }, []);

    if (isLimited) {
        return (
            <div className={styles.wrap}>
                <div className={styles.emptyCard}>
                    <div className={styles.emptyIcon} style={{ background: isPrivate ? '#FEF2F2' : '#F0FDF4' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                             stroke={isPrivate ? '#DC2626' : '#16A34A'}
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            {isPrivate && <path d="M12 8v4"/>}
                            {isPrivate && <circle cx="12" cy="16" r="1"/>}
                        </svg>
                    </div>
                    <p className={styles.emptyTitle}>
                        {isPrivate ? 'Hồ sơ đã được đặt ở chế độ riêng tư' : 'Hồ sơ chỉ hiển thị với bạn bè'}
                    </p>
                    <p className={styles.emptySub}>
                        {isPrivate
                            ? 'Chủ hồ sơ đã chọn ẩn nội dung với tất cả mọi người.'
                            : `Theo dõi ${profile?.fullName || 'người này'} và chờ họ theo dõi lại để xem nội dung.`}
                    </p>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    if (initialLoading) {
        return (
            <div className={styles.wrap}>
                <div className={styles.emptyCard}>
                    <div className={styles.spinner} />
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className={styles.wrap}>
                <div className={styles.emptyCard}>
                    <div className={styles.emptyIcon}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <line x1="10" y1="9" x2="8" y2="9" />
                        </svg>
                    </div>
                    <p className={styles.emptyTitle}>
                        {profile?.fullName ? `${profile.fullName} chưa có bài viết nào` : 'Chưa có bài viết nào'}
                    </p>
                    <p className={styles.emptySub}>Bài viết của người dùng này sẽ hiển thị ở đây</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrap}>
            {posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    onDeleted={handlePostDeleted}
                    onUpdated={handlePostUpdated}
                    openCommentPostId={openCommentPostId}
                    onToggleComment={handleToggleComment}
                />
            ))}

            {hasMore && (
                <div ref={triggerRef} style={{ padding: '12px', textAlign: 'center' }}>
                    {loading && <span style={{ color: '#9CA3AF', fontSize: 13 }}>Đang tải...</span>}
                </div>
            )}
        </div>
    );
}
