import {useEffect, useState, useCallback} from 'react';
import {Bookmark} from 'lucide-react';
import {savedPostApi} from '../../../api/post-service/savedPostApi';
import type {FeedPostResponse} from '../../../types/post.types';
import PostCard from '../../post/components/PostCard';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

const PAGE_SIZE = 10;

export default function SavedPage() {
    const [posts, setPosts] = useState<FeedPostResponse[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openCommentId, setOpenCommentId] = useState<number | null>(null);

    const fetchSaved = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await savedPostApi.getSavedPosts(pageNum, PAGE_SIZE);
            const data = res.data.data;
            if (pageNum === 0) {
                setPosts(data.content);
            } else {
                setPosts(prev => [...prev, ...data.content]);
            }
            setTotalPages(data.totalPages);
        } catch {
            // giữ state cũ nếu lỗi
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchSaved(0);
    }, [fetchSaved]);

    const hasMore = page + 1 < totalPages;

    const handleLoadMore = useCallback(() => {
        const next = page + 1;
        setPage(next);
        void fetchSaved(next);
    }, [page, totalPages]);

    const triggerRef = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasMore,
        isLoading: loading,
    });

    const handleRemoved = useCallback((postId: number) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
    }, []);

    const handleUpdated = useCallback((updated: FeedPostResponse) => {
        setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
    }, []);

    return (
        <div style={{maxWidth: 680, margin: '0 auto', padding: '0 0 24px'}}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 20,
                background: '#FFFFFF',
                borderRadius: 8,
                padding: '16px 20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Bookmark size={18} color="#3B82F6"/>
                </div>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 600,
                        color: '#111827',
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        Thư viện của tôi
                    </h1>
                    <p style={{margin: 0, fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif'}}>
                        Các bài viết bạn đã lưu
                    </p>
                </div>
            </div>

            {posts.length === 0 && !loading && (
                <div style={{
                    textAlign: 'center', padding: '48px 24px',
                    background: '#FFFFFF', borderRadius: 8,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                }}>
                    <Bookmark size={40} color="#D1D5DB" style={{marginBottom: 12}}/>
                    <p style={{margin: 0, fontSize: 14, color: '#6B7280', fontFamily: 'Inter, sans-serif'}}>
                        Chưa có bài viết nào được lưu
                    </p>
                </div>
            )}

            {posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    isSaved={true}
                    onDeleted={handleRemoved}
                    onUpdated={handleUpdated}
                    openCommentPostId={openCommentId}
                    onToggleComment={setOpenCommentId}
                />
            ))}

            {loading && hasMore && (
                <div style={{
                    textAlign: 'center',
                    padding: '16px 0',
                    fontSize: 13,
                    color: '#6B7280',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    Đang tải...
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