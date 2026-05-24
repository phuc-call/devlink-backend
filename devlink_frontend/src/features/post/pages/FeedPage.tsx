// src/features/feed/pages/FeedPage.tsx
import { useState, useEffect, useCallback } from 'react';
import ProfileSetupModal from '../../profile/components/ProfileSetupModal';
import { useProfileSetup } from '../../../hooks/useProfileSetup.ts';
import CreatePostModal from '../../../components/post/CreatePostModal/CreatePostModal';
import { getFeedApi } from '../../../api/post-service/getFeedApi';
import type { FeedPostResponse } from '../../../types/post.types';
import PostCard from '../components/PostCard';

export default function FeedPage() {
    const { showModal, closeModal } = useProfileSetup();
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [posts, setPosts] = useState<FeedPostResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const loadFeed = useCallback(async (pageNum: number, reset = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await getFeedApi.getFeed(pageNum, 20);
            const data = res.data.data;
            if (reset || pageNum === 0) {
                setPosts(data.content);
            } else {
                setPosts(prev => [...prev, ...data.content]);
            }
            setHasMore(!data.last);
        } catch (err) {
            console.error('Lỗi load feed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFeed(0);
    }, []);

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        loadFeed(next);
    };

    const handlePostSuccess = () => {
        setPage(0);
        loadFeed(0, true);
    };

    return (
        <>
            {showModal && <ProfileSetupModal onClose={closeModal} />}

            {showCreatePost && (
                <CreatePostModal
                    onClose={() => setShowCreatePost(false)}
                    onSuccess={() => {
                        setShowCreatePost(false);
                        handlePostSuccess();
                    }}
                    avatarUrl={undefined}
                    displayName={undefined}
                />
            )}

            {/* Create post bar */}
            <div
                style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: '10px 16px',
                    marginBottom: 12,
                    border: '1px solid #E4E6EB',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                }}
                onClick={() => setShowCreatePost(true)}
            >
                <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: '#E4E6EB', flexShrink: 0,
                }} />
                <span style={{
                    flex: 1,
                    color: '#BEC3C9',
                    fontSize: 15,
                    background: '#F0F2F5',
                    borderRadius: 20,
                    padding: '8px 14px',
                    userSelect: 'none',
                }}>
                    Bạn đang nghĩ gì?
                </span>
            </div>

            {/* Feed list */}
            {loading && posts.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    minHeight: '40vh', color: '#6B7280', fontSize: 14, gap: 8,
                }}>
                    <span style={{ fontSize: 32 }}>⏳</span>
                    <p style={{ margin: 0 }}>Đang tải bài viết...</p>
                </div>
            ) : posts.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    minHeight: '40vh', color: '#6B7280', fontSize: 14, gap: 8,
                }}>
                    <span style={{ fontSize: 32 }}>📭</span>
                    <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>Chưa có bài viết nào</p>
                    <p style={{ margin: 0 }}>Hãy kết bạn hoặc đăng bài đầu tiên!</p>
                </div>
            ) : (
                <>
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '16px', color: '#6B7280', fontSize: 13 }}>
                            Đang tải thêm...
                        </div>
                    )}

                    {!loading && hasMore && (
                        <button
                            onClick={handleLoadMore}
                            style={{
                                width: '100%', padding: '12px',
                                background: '#EFF6FF', color: '#3B82F6',
                                border: 'none', borderRadius: '8px',
                                cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                                marginBottom: 12,
                            }}
                        >
                            Xem thêm
                        </button>
                    )}

                    {!loading && !hasMore && (
                        <div style={{
                            textAlign: 'center', padding: '16px',
                            color: '#9CA3AF', fontSize: 13,
                        }}>
                            Đã xem hết bài viết
                        </div>
                    )}
                </>
            )}
        </>
    );
}