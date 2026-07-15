import {useCallback, useEffect, useRef, useState} from 'react';
import {Inbox, Loader2, UsersRound} from 'lucide-react';
import {getFeedApi} from '../../../api/post-service/getFeedApi';
import {followApi} from '../../../api/user-service/followApi';
import type {FeedPostResponse} from '../../../types/post.types';
import type {UserFollowingCardResponse} from '../../../types/follow.types';
import PostCard from '../components/PostCard';
import UserFollowingCard from '../components/UserFollowingCard';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

function randomFirstLoadSize() {
    return 4; // keep within backend max
}

function randomNextLoadSize() {
    return 4; // keep within backend max
}

function getPageContent<T>(data: unknown): T[] {
    if (!data || typeof data !== 'object') return [];

    const value = data as {
        content?: T[];
        data?: {
            content?: T[];
        };
    };

    if (Array.isArray(value.content)) return value.content;
    if (Array.isArray(value.data?.content)) return value.data.content;

    return [];
}

function getPageLast(data: unknown) {
    if (!data || typeof data !== 'object') return true;

    const value = data as {
        last?: boolean;
        hasNext?: boolean;
        data?: {
            last?: boolean;
            hasNext?: boolean;
        };
    };

    if (typeof value.last === 'boolean') return value.last;
    if (typeof value.data?.last === 'boolean') return value.data.last;

    if (typeof value.hasNext === 'boolean') return !value.hasNext;
    if (typeof value.data?.hasNext === 'boolean') return !value.data.hasNext;

    return true;
}

function normalizePost(post: FeedPostResponse): FeedPostResponse {
    return {
        ...post,
        tags: post.tags ?? [],
        mediaList: post.mediaList ?? [],
    };
}

export default function FollowingPage() {
    const [posts, setPosts] = useState<FeedPostResponse[]>([]);
    const [followingUsers, setFollowingUsers] = useState<UserFollowingCardResponse[]>([]);

    const [postPage, setPostPage] = useState(0);
    const [userPage, setUserPage] = useState(0);

    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [hasMoreUsers, setHasMoreUsers] = useState(true);

    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);


    const [errorMessage, setErrorMessage] = useState('');

    const [openCommentPostId, setOpenCommentPostId] = useState<number | null>(null);

    const loadingPostsRef = useRef(false);
    const loadingUsersRef = useRef(false);

    const loadFollowingUsers = useCallback((pageNum: number, reset = false) => {
        if (loadingUsersRef.current) return;

        loadingUsersRef.current = true;
        setLoadingUsers(true);

        followApi.getFollowingCards(pageNum, 20)
            .then(res => {
                const pageData = res.data.data;
                const content = getPageContent<UserFollowingCardResponse>(pageData);

                setFollowingUsers(prev => reset ? content : [...prev, ...content]);
                setHasMoreUsers(!getPageLast(pageData));
                setUserPage(pageNum);
            })
            .catch(err => {
                console.error('Lỗi load following cards:', err);
            })
            .finally(() => {
                loadingUsersRef.current = false;
                setLoadingUsers(false);
            });
    }, []);

    const loadFollowingPosts = useCallback((pageNum: number, reset = false, size?: number) => {
        if (loadingPostsRef.current) return;

        loadingPostsRef.current = true;
        setLoadingPosts(true);
        setErrorMessage('');

        const pageSize = size ?? (pageNum === 0 ? randomFirstLoadSize() : randomNextLoadSize());

        getFeedApi.getFollowingFeed(pageNum, pageSize)
            .then(res => {
                const pageData = res.data.data;
                const content = getPageContent<FeedPostResponse>(pageData).map(normalizePost);

                setPosts(prev => reset ? content : [...prev, ...content]);
                setHasMorePosts(!getPageLast(pageData));
                setPostPage(pageNum);
            })
            .catch(err => {
                console.error('Lỗi load following feed:', err);
                setErrorMessage('Trang này đang được bảo trì, vui lòng thử lại sau.');
            })
            .finally(() => {
                loadingPostsRef.current = false;
                setLoadingPosts(false);

            });
    }, []);

    useEffect(() => {
        loadFollowingUsers(0, true);
        loadFollowingPosts(0, true, randomFirstLoadSize());
    }, [loadFollowingUsers, loadFollowingPosts]);

    const handleLoadMorePosts = useCallback(() => {
        loadFollowingPosts(postPage + 1, false, randomNextLoadSize());
    }, [postPage, loadFollowingPosts]);

    const handleLoadMoreUsers = useCallback(() => {
        loadFollowingUsers(userPage + 1);
    }, [userPage, loadFollowingUsers]);

    const usersTriggerRef = useInfiniteScroll({
        onLoadMore: handleLoadMoreUsers,
        hasMore: hasMoreUsers,
        isLoading: loadingUsers,
    });

    const postsTriggerRef = useInfiniteScroll({
        onLoadMore: handleLoadMorePosts,
        hasMore: hasMorePosts,
        isLoading: loadingPosts,
    });

    const handlePostDeleted = useCallback((id: number) => {
        setPosts(prev => prev.filter(post => post.id !== id));
    }, []);

    const handlePostUpdated = useCallback((updated: FeedPostResponse) => {
        setPosts(prev => prev.map(post => post.id === updated.id ? updated : post));
    }, []);

    const handleToggleComment = useCallback((id: number | null) => {
        setOpenCommentPostId(prev => prev === id ? null : id);
    }, []);

    return (
        <div>


            <section
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                    }}
                >
                </div>

                {loadingUsers && followingUsers.length === 0 ? (
                    <div
                        style={{
                            height: 170,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6B7280',
                            gap: 8,
                            fontSize: 13,
                        }}
                    >
                        <Loader2 size={18} style={{animation: 'spin 1s linear infinite'}}/>
                        Đang tải danh sách following...
                    </div>
                ) : followingUsers.length === 0 ? (
                    <div
                        style={{
                            height: 120,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6B7280',
                            gap: 8,
                            fontSize: 13,
                            textAlign: 'center',
                        }}
                    >
                        <UsersRound size={32} color="#D1D5DB"/>
                        Bạn chưa theo dõi người dùng nào.
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            gap: 12,
                            overflowX: 'auto',
                            paddingBottom: 4,
                            scrollbarWidth: 'thin',
                        }}
                    >
                        {followingUsers.map(user => (
                            <UserFollowingCard key={user.userId} user={user}/>
                        ))}

                        {loadingUsers && (
                            <div
                                style={{
                                    minWidth: 90,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#6B7280',
                                }}
                            >
                                <Loader2 size={18} style={{animation: 'spin 1s linear infinite'}}/>
                            </div>
                        )}
                    </div>
                )}

                {hasMoreUsers && (
                    <div ref={usersTriggerRef} style={{ padding: '8px' }}></div>
                )}
            </section>

            {errorMessage && (
                <div
                    style={{
                        background: '#FFF7ED',
                        border: '1px solid #FED7AA',
                        color: '#C2410C',
                        padding: '12px 14px',
                        borderRadius: 10,
                        fontSize: 13,
                        marginBottom: 12,
                        fontWeight: 600,
                    }}
                >
                    {errorMessage}
                </div>
            )}

            {loadingPosts && posts.length === 0 ? (
                <div
                    style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: 12,
                        minHeight: 220,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6B7280',
                        gap: 10,
                        fontSize: 14,
                    }}
                >
                    <Loader2 size={28} color="#2563EB" style={{animation: 'spin 1s linear infinite'}}/>
                    Đang tải bài viết từ following...
                </div>
            ) : posts.length === 0 ? (
                <div
                    style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: 12,
                        minHeight: 220,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6B7280',
                        gap: 10,
                        fontSize: 14,
                        textAlign: 'center',
                        padding: 20,
                    }}
                >
                    <Inbox size={44} color="#D1D5DB"/>
                    <div style={{color: '#111827', fontWeight: 800}}>
                        Chưa có bài viết từ following
                    </div>
                    <div style={{maxWidth: 360, lineHeight: 1.5}}>
                        Khi người bạn theo dõi đăng bài, bài viết sẽ xuất hiện tại đây.
                    </div>
                </div>
            ) : (
                <>
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

                    {loadingPosts && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                color: '#6B7280',
                                padding: 16,
                                fontSize: 13,
                            }}
                        >
                            <Loader2 size={16} style={{animation: 'spin 1s linear infinite'}}/>
                            Đang tải thêm bài viết...
                        </div>
                    )}

                    {hasMorePosts && (
                        <div ref={postsTriggerRef} style={{ padding: '16px', textAlign: 'center' }}>
                            {loadingPosts && <span style={{ color: '#9CA3AF', fontSize: 13 }}>Đang tải...</span>}
                        </div>
                    )}


                </>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}