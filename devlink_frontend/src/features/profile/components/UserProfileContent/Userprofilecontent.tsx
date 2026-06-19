import { useCallback, useEffect, useState, useRef } from 'react';
import type { UserProfileResponse } from '../../../../types/profile.types';
import type { FeedPostResponse } from '../../../../types/post.types';
import { postApi } from '../../../../api/post-service/postApi';
import PostCard from '../../../post/components/PostCard';
import styles from './UserProfileContent.module.css';

interface Props {
    profile: UserProfileResponse | null;
}

export default function UserProfileContent({ profile }: Props) {
    const [posts, setPosts] = useState<FeedPostResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [openCommentPostId, setOpenCommentPostId] = useState<number | null>(null);
    const loadingRef = useRef(false);

    const loadPosts = useCallback((pageNum: number, reset = false) => {
        if (loadingRef.current || !profile) return;
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
            });
    }, [profile]);

    useEffect(() => {
        if (profile) {
            loadPosts(0, true);
        }
    }, [profile?.userId]);

    const handleLoadMore = () => {
        loadPosts(page + 1);
    };

    const handlePostDeleted = useCallback((deletedId: number) => {
        setPosts(prev => prev.filter(p => p.id !== deletedId));
    }, []);

    const handlePostUpdated = useCallback((updated: FeedPostResponse) => {
        setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    }, []);

    const handleToggleComment = useCallback((postId: number | null) => {
        setOpenCommentPostId(prev => (prev === postId ? null : postId));
    }, []);

    if (!profile || posts.length === 0) {
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
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loading}
                        style={{
                            padding: '10px 18px', borderRadius: 10,
                            border: '1px solid #E5E7EB', background: '#FFFFFF',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            color: '#374151', fontSize: 14,
                            fontFamily: 'Inter, sans-serif', fontWeight: 500,
                        }}
                    >
                        {loading ? 'Đang tải...' : 'Xem thêm bài viết'}
                    </button>
                </div>
            )}
        </div>
    );
}
