// src/features/post/pages/FeedPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Inbox } from 'lucide-react';
import ProfileSetupModal from '../../profile/components/ProfileSetupModal';
import { useProfileSetup } from '../../../hooks/useProfileSetup.ts';
import CreatePostModal from '../../../components/post/CreatePostModal/CreatePostModal';
import { getFeedApi } from '../../../api/post-service/getFeedApi';
import type { FeedPostResponse } from '../../../types/post.types';
import PostCard from '../components/PostCard';
import { getCurrentUserInfo } from '../../../utils/auth';

export default function FeedPage() {
    const { showModal, closeModal } = useProfileSetup();
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [posts, setPosts]     = useState<FeedPostResponse[]>([]);
    const [page, setPage]       = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string | undefined>(undefined);
    const loadingRef = useRef(false);

    // Load user info for avatar
    useEffect(() => {
        getCurrentUserInfo().then(info => {
            if (info) {
                setAvatarUrl(info.avatar);
                setDisplayName(info.userName);
            }
        });
    }, []);

    const loadFeed = useCallback(async (pageNum: number, reset = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        try {
            const res  = await getFeedApi.getFeed(pageNum, 20);
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
            loadingRef.current = false;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadFeed(0);
    }, [loadFeed]);

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        void loadFeed(next);
    };

    const handlePostCreated = () => {
        setPage(0);
        void loadFeed(0, true);
    };

    const handlePostDeleted = useCallback((id: number) => {
        setPosts(prev => prev.filter(p => p.id !== id));
    }, []);

    const handlePostUpdated = useCallback((updated: FeedPostResponse) => {
        setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    }, []);

    const renderFeedContent = () => {
        if (loading && posts.length === 0) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    minHeight: '40vh', color: '#6B7280', gap: 12,
                }}>
                    <Loader2
                        size={32}
                        color="#3B82F6"
                        style={{ animation: 'spin 1s linear infinite' }}
                    />
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
                        Hãy kết bạn hoặc đăng bài đầu tiên!
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
                    />
                ))}

                {loading && (
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px', gap: 8,
                        color: '#6B7280', fontSize: 13,
                    }}>
                        <Loader2
                            size={16}
                            style={{ animation: 'spin 1s linear infinite' }}
                        />
                        Đang tải thêm...
                        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                    </div>
                )}

                {!loading && hasMore && (
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        style={{
                            width: '100%', padding: '12px',
                            background: '#EFF6FF', color: '#3B82F6',
                            border: 'none', borderRadius: 8,
                            cursor: 'pointer', fontSize: 14,
                            fontWeight: 500, marginBottom: 12,
                            fontFamily: 'Inter, sans-serif',
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
            </div>
        );
    };

    return (
        <>
            {showModal && <ProfileSetupModal onClose={closeModal} />}

            {showCreatePost && (
                <CreatePostModal
                    onClose={() => setShowCreatePost(false)}
                    onSuccess={() => {
                        setShowCreatePost(false);
                        handlePostCreated();
                    }}
                    avatarUrl={avatarUrl ?? undefined}
                    displayName={displayName}
                />
            )}

            {/* Create post bar */}
            <button
                type="button"
                onClick={() => setShowCreatePost(true)}
                style={{
                    background: '#fff', borderRadius: 10,
                    padding: '10px 16px', marginBottom: 12,
                    border: '1px solid #E4E6EB',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', width: '100%',
                    textAlign: 'left',
                }}
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="avatar"
                        style={{
                            width: 38, height: 38, borderRadius: '50%',
                            objectFit: 'cover', flexShrink: 0,
                        }}
                    />
                ) : (
                    <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: '#E4E6EB', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 600, color: '#6B7280',
                    }}>
                        {displayName ? displayName.charAt(0).toUpperCase() : ''}
                    </div>
                )}
                <span style={{
                    flex: 1, color: '#BEC3C9', fontSize: 15,
                    background: '#F0F2F5', borderRadius: 20,
                    padding: '8px 14px', userSelect: 'none',
                }}>
                    Bạn đang nghĩ gì?
                </span>
            </button>

            {renderFeedContent()}
        </>
    );
}