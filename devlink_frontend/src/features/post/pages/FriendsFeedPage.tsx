// src/features/post/pages/FriendsFeedPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Inbox } from 'lucide-react';
import { getFeedApi } from '../../../api/post-service/getFeedApi';
import type { FeedPostResponse } from '../../../types/post.types';
import PostCard from '../components/PostCard';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

export default function FriendsFeedPage() {
    const [posts, setPosts]                   = useState<FeedPostResponse[]>([]);
    const [page, setPage]                     = useState(0);
    const [hasMore, setHasMore]               = useState(true);
    const [loading, setLoading]               = useState(false);

    // ── Chỉ 1 PostCard được mở comment tại một thời điểm ──
    const [openCommentPostId, setOpenCommentPostId] = useState<number | null>(null);

    const loadingRef = useRef(false);

    const loadFeed = useCallback((pageNum: number, reset = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        getFeedApi.getFriendsFeed(pageNum, 4)
            .then(res => {
                const data = res.data.data;
                const content = data.content || [];
                if (reset || pageNum === 0) {
                    setPosts(content);
                } else {
                    setPosts(prev => [...prev, ...content]);
                }
                setHasMore(!data.last);
                setPage(pageNum);
            })
            .catch(err => { console.error('Lỗi load friends feed:', err); })
            .finally(() => {
                loadingRef.current = false;
                setLoading(false);
            });
    }, []);

    useEffect(() => { loadFeed(0); }, [loadFeed]);

    const handleLoadMore = useCallback(() => {
        loadFeed(page + 1);
    }, [page, loadFeed]);

    const triggerRef = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasMore,
        isLoading: loading,
    });

    const handlePostDeleted = useCallback((id: number) => {
        setPosts(prev => prev.filter(p => p.id !== id));
    }, []);

    const handlePostUpdated = useCallback((updated: FeedPostResponse) => {
        setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    }, []);

    const handleToggleComment = useCallback((id: number | null) => {
        setOpenCommentPostId(prev => (prev === id ? null : id));
    }, []);

    if (loading && posts.length === 0) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                minHeight: '40vh', color: '#6B7280', gap: 12,
            }}>
                <Loader2 size={32} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ margin: 0, fontSize: 14 }}>Đang tải bài viết...</p>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                minHeight: '40vh', color: '#6B7280', gap: 12,
            }}>
                <Inbox size={48} color="#D1D5DB" />
                <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: 14 }}>
                    Chưa có bài viết nào
                </p>
                <p style={{ margin: 0, fontSize: 13 }}>
                    Hãy kết bạn với nhiều người hơn!
                </p>
            </div>
        );
    }

    return (
        <div>
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

            {loading && hasMore && (
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '16px', gap: 8,
                    color: '#6B7280', fontSize: 13,
                }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Đang tải thêm...
                    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                </div>
            )}

            {hasMore && (
                <div ref={triggerRef} style={{ padding: '16px', textAlign: 'center' }}>
                    {loading && <span style={{ color: '#9CA3AF', fontSize: 13 }}>Đang tải...</span>}
                </div>
            )}


        </div>
    );
}
