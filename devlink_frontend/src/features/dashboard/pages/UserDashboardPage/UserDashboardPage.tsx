import { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { userProfileApi } from '../../../../api/user-service/userProfileApi';
import styles from './UserDashboardPage.module.css';
import { Users, UserPlus, Shield, Bell, UsersRound, Award } from 'lucide-react';
import ImagePreviewModal from '../../../../components/common/ImagePreviewModal/ImagePreviewModal';
import PostCard from '../../../post/components/PostCard';
import { postApi } from '../../../../api/post-service/postApi';
import type { FeedPostResponse } from '../../../../types/post.types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const REACTION_ICONS: Record<string, React.ReactNode> = {
    LIKE: <svg viewBox="0 0 24 24" width="24" height="24" fill="#2563EB"><path d="M2 10h4v10H2v-10zm20 2c0-1.1-.9-2-2-2h-5.3l.8-3.9v-.4c0-.4-.1-.8-.4-1l-1-1-4.7 4.8c-.3.3-.5.7-.5 1.1v8c0 1.1.9 2 2 2h6.5c.8 0 1.5-.5 1.8-1.2l3-7c.1-.2.2-.5.2-.8v-1.6z" /></svg>,
    LOVE: <svg viewBox="0 0 24 24" width="24" height="24" fill="#EF4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>,
    HAHA: <svg viewBox="0 0 24 24" width="24" height="24" fill="#F59E0B"><circle cx="12" cy="12" r="10" /><path fill="#fff" d="M12 16.5c-2.3 0-4.3-1.4-5.2-3.5h10.4c-.9 2.1-2.9 3.5-5.2 3.5z" /><circle fill="#fff" cx="8.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="15.5" cy="9.5" r="1.5" /></svg>,
    WOW: <svg viewBox="0 0 24 24" width="24" height="24" fill="#F59E0B"><circle cx="12" cy="12" r="10" /><circle fill="#fff" cx="8.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="15.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="12" cy="16" r="2.5" /></svg>,
    SAD: <svg viewBox="0 0 24 24" width="24" height="24" fill="#F59E0B"><circle cx="12" cy="12" r="10" /><path fill="#fff" d="M12 13.5c-2 0-3.8 1.1-4.7 2.8l1.7.9c.6-1 1.6-1.7 3-1.7s2.4.7 3 1.7l1.7-.9c-.9-1.7-2.7-2.8-4.7-2.8z" /><circle fill="#fff" cx="8.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="15.5" cy="9.5" r="1.5" /></svg>,
    ANGRY: <svg viewBox="0 0 24 24" width="24" height="24" fill="#EA580C"><circle cx="12" cy="12" r="10" /><path fill="#fff" d="M8.5 11c.8 0 1.5-.7 1.5-1.5S9.3 8 8.5 8 7 8.7 7 9.5 7.7 11 8.5 11zm7 0c.8 0 1.5-.7 1.5-1.5S16.3 8 15.5 8 14 8.7 14 9.5 14.7 11 15.5 11zm-3.5 3c-2.3 0-4.3 1.4-5.2 3.5h10.4c-.9-2.1-2.9-3.5-5.2-3.5z" /><path stroke="#fff" strokeWidth="2" strokeLinecap="round" d="M6 7l3 1.5M18 7l-3 1.5" /></svg>,
};

export default function UserDashboardPage() {
    const [overview, setOverview] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const fetchOverview = async () => {
            setLoading(true);
            try {
                const res = await userProfileApi.getUserOverview();
                setOverview(res.data.data);
            } catch (error) {
                console.error('Failed to fetch dashboard overview:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOverview();
    }, []);

    if (loading) {
        return <div className={styles.loadingContainer}>Loading dashboard data...</div>;
    }

    if (!overview) {
        return null;
    }

    // Prepare data for charts
    const followData = [
        { name: 'Followers', value: overview.followerCount },
        { name: 'Following', value: overview.followingCount },
    ];

    const statsData = [
        { name: 'New Followers', value: overview.newFollowersThisWeek },
        { name: 'Groups', value: overview.groupCount },
        { name: 'Unread Notifications', value: overview.unreadNotificationCount },
    ];

    return (
        <div className={styles.pageContainer}>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard/user-info" replace />} />
                
                <Route path="user-info" element={
                    <div className={styles.section}>
                        <div className={styles.infoCard}>
                            <div className={styles.infoItem}>
                                <h3>Badge Level</h3>
                                <p className={styles.badgeText}>{overview.badge || 'No Badge'}</p>
                            </div>
                        </div>
                    </div>
                } />

                <Route path="general" element={
                    <div className={styles.section}>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statIconWrap} style={{ background: '#e0f2fe', color: '#0284c7' }}>
                                    <Users size={24} />
                                </div>
                                <div className={styles.statInfo}>
                                    <p className={styles.statLabel}>Followers</p>
                                    <p className={styles.statValue}>{overview.followerCount}</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIconWrap} style={{ background: '#fce7f3', color: '#be185d' }}>
                                    <UserPlus size={24} />
                                </div>
                                <div className={styles.statInfo}>
                                    <p className={styles.statLabel}>Following</p>
                                    <p className={styles.statValue}>{overview.followingCount}</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIconWrap} style={{ background: '#dcfce7', color: '#15803d' }}>
                                    <UsersRound size={24} />
                                </div>
                                <div className={styles.statInfo}>
                                    <p className={styles.statLabel}>Groups</p>
                                    <p className={styles.statValue}>{overview.groupCount}</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIconWrap} style={{ background: '#fef3c7', color: '#b45309' }}>
                                    <Bell size={24} />
                                </div>
                                <div className={styles.statInfo}>
                                    <p className={styles.statLabel}>Unread Alerts</p>
                                    <p className={styles.statValue}>{overview.unreadNotificationCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.chartsGrid}>
                            <div className={styles.chartCard}>
                                <h3 className={styles.chartTitle}>Followers vs Following</h3>
                                <div className={styles.chartWrapper}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={followData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                                label
                                            >
                                                {followData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className={styles.chartCard}>
                                <h3 className={styles.chartTitle}>Weekly Overview</h3>
                                <div className={styles.chartWrapper}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={statsData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                                            <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                                {statsData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                } />

                <Route path="posts" element={
                    <ReactHistorySection />
                } />

                <Route path="interests" element={
                    <UserInterestsSection />
                } />
            </Routes>
        </div>
    );
}

function ReactHistorySection() {
    const [activeTab, setActiveTab] = useState<'my-activity' | 'my-comments' | 'interaction'>('my-activity');
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    // Overlay states
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    const [viewingPostId, setViewingPostId] = useState<number | null>(null);
    const [viewingPostData, setViewingPostData] = useState<FeedPostResponse | null>(null);

    const fetchHistory = async (pageNumber: number, reset = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const { overviewPostApi } = await import('../../../../api/post-service/overviewPostApi');
            const res = await overviewPostApi.getReactHistory(pageNumber, 10);
            if (res.data.success) {
                const newItems = res.data.data.content;
                setHistory(prev => reset ? newItems : [...prev, ...newItems]);
                setHasMore(!res.data.data.last);
            }
        } catch (error) {
            console.error('Failed to fetch react history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        setHistory([]);
        setPage(0);
        setHasMore(true);
        fetchHistory(0, true);
    }, []);

    // Infinite scroll observer
    useEffect(() => {
        if (!loaderRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage(prev => {
                        const next = prev + 1;
                        fetchHistory(next);
                        return next;
                    });
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    return (
        <div className={styles.activitySection}>
            {/* Header */}
            <div className={styles.activityHeader}>
                <h2 className={styles.activityTitle}>Activity Management</h2>
            </div>

            {/* Tabs */}
            <div className={styles.tabBar}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'my-activity' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('my-activity')}
                >
                    My Activity
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'my-comments' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('my-comments')}
                >
                    My Comments
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'interaction' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('interaction')}
                >
                    Interaction Management
                </button>
            </div>

            {/* My Activity Tab */}
            {activeTab === 'my-activity' && (
                <div className={styles.activityScrollArea}>
                    <div className={styles.activityColHeader}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                        Liked Posts
                    </div>

                    {!loading && history.length === 0 ? (
                        <div className={styles.colEmpty}>
                            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/></svg>
                            <p>No activity yet. Start reacting to posts!</p>
                        </div>
                    ) : (
                        <div className={styles.activityGrid}>
                            {history.map(item => (
                                <div key={item.reactId} className={styles.activityCard}>
                                    {/* Header: Avatar Stack + Info */}
                                    <div className={styles.activityCardHeader}>
                                        <div className={styles.avatarStack}>
                                            {item.groupId ? (
                                                <>
                                                    <img
                                                        src={item.groupImage || '/default-group.png'}
                                                        alt={item.groupName}
                                                        className={styles.groupAvatarStack}
                                                        onClick={() => window.open(`/groups/${item.groupId}`, '_blank')}
                                                        title={item.groupName}
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    />
                                                    <img
                                                        src={item.authorAvatarUrl || '/default-avatar.png'}
                                                        alt={item.authorName}
                                                        className={styles.userAvatarStackOverlap}
                                                        onClick={() => window.open(`/profile/${item.authorId}`, '_blank')}
                                                        title={item.authorName}
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    />
                                                </>
                                            ) : (
                                                <img
                                                    src={item.authorAvatarUrl || '/default-avatar.png'}
                                                    alt={item.authorName}
                                                    className={styles.userAvatarStackSingle}
                                                    onClick={() => window.open(`/profile/${item.authorId}`, '_blank')}
                                                    title={item.authorName}
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            )}
                                        </div>
                                        
                                        <div className={styles.headerInfo}>
                                            <div className={styles.headerName}>
                                                <span 
                                                    className={styles.headerAuthorName}
                                                    onClick={() => window.open(`/profile/${item.authorId}`, '_blank')}
                                                >
                                                    {item.authorName}
                                                </span>
                                                {item.groupId && (
                                                    <>
                                                        <span className={styles.headerNameSeparator}> ▶ </span>
                                                        <span 
                                                            className={styles.headerGroupName}
                                                            onClick={() => window.open(`/groups/${item.groupId}`, '_blank')}
                                                        >
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

                                    {/* Post Content */}
                                    <div className={styles.activityCardBody}>
                                        <p className={styles.activityCardContent}>
                                            {item.postContent || <span className={styles.activityMediaOnly}>Media post</span>}
                                        </p>
                                    </div>

                                    {/* Thumbnail image (Fully Visible) */}
                                    {item.files && item.files.length > 0 && (
                                        <div className={styles.activityCardImageFull}>
                                            <img
                                                src={item.files[0].url}
                                                alt="post thumbnail"
                                                className={styles.activityImageUncropped}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => {
                                                    setPreviewImages(item.files.map((f: any) => f.url));
                                                    setIsPreviewOpen(true);
                                                }}
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </div>
                                    )}

                                    {/* Footer Actions */}
                                    <div className={styles.activityCardFooter}>
                                        <button
                                            className={styles.activityViewBtn}
                                            onClick={async () => {
                                                try {
                                                    const res = await postApi.getPostById(item.postId);
                                                    if (res.data && res.data.data) {
                                                        setViewingPostData(res.data.data);
                                                        setViewingPostId(item.postId);
                                                    }
                                                } catch (error) {
                                                    console.error('Failed to fetch post details:', error);
                                                }
                                            }}
                                            title="View post"
                                        >
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                            View Post
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Infinite scroll trigger */}
                    <div ref={loaderRef} className={styles.scrollLoader}>
                        {loading && (
                            <span className={styles.scrollLoaderText}>Loading more...</span>
                        )}
                        {!hasMore && history.length > 0 && (
                            <span className={styles.scrollEndText}>You've reached the end</span>
                        )}
                    </div>
                </div>
            )}

            {/* My Comments Tab */}
            {activeTab === 'my-comments' && (
                <div className={styles.comingDevelopmentFull}>
                    <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p className={styles.comingTitle}>Coming Soon</p>
                    <p className={styles.comingDesc}>Comment history will be available in the next release.</p>
                </div>
            )}

            {/* Interaction Management Tab */}
            {activeTab === 'interaction' && (
                <div className={styles.comingDevelopmentFull}>
                    <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className={styles.comingTitle}>Coming Soon</p>
                    <p className={styles.comingDesc}>Interaction management features will be available soon.</p>
                </div>
            )}

            {/* Overlays */}
            {isPreviewOpen && (
                <ImagePreviewModal
                    images={previewImages}
                    currentIndex={0}
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}

            {viewingPostData && (
                <div className={styles.postOverlayOverlay}>
                    <div className={styles.postOverlayContent}>
                        <button className={styles.postOverlayClose} onClick={() => setViewingPostData(null)}>✕</button>
                        <div className={styles.postOverlayScroll}>
                            <PostCard 
                                post={viewingPostData}
                                onDeleted={() => setViewingPostData(null)}
                                onUpdated={(updated) => setViewingPostData(updated)}
                                openCommentPostId={viewingPostData.id}
                                onToggleComment={() => {}}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


function UserInterestsSection() {
    const [interests, setInterests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [tagToDelete, setTagToDelete] = useState<string | null>(null);

    const fetchInterests = async (pageNumber: number) => {
        setLoading(true);
        try {
            const { userInterestApi } = await import('../../../../api/post-service/userInterestApi');
            const res = await userInterestApi.getMyInterests(pageNumber, 12);
            if (res.data.success) {
                setInterests(res.data.data.content);
                setTotalPages(res.data.data.totalPages);
            }
        } catch (error) {
            console.error('Failed to fetch user interests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterests(page);
    }, [page]);

    const handleDelete = (tag: string) => {
        setTagToDelete(tag);
    };

    const confirmDelete = async () => {
        if (!tagToDelete) return;
        const tag = tagToDelete;
        setTagToDelete(null);
        
        try {
            const { userInterestApi } = await import('../../../../api/post-service/userInterestApi');
            const res = await userInterestApi.deleteMyInterest(tag);
            if (res.data.success) {
                // If it's the last item on the page and not the first page, go back
                if (interests.length === 1 && page > 0) {
                    setPage(p => p - 1);
                } else {
                    fetchInterests(page);
                }
            }
        } catch (error) {
            console.error('Failed to delete interest:', error);
        }
    };

    const handlePrevPage = () => {
        if (page > 0) setPage(p => p - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) setPage(p => p + 1);
    };

    return (
        <div className={styles.section}>
            <div className={styles.infoCard}>
                {loading ? (
                    <div className={styles.loadingContainer}>Đang tải chủ đề...</div>
                ) : interests.length === 0 ? (
                    <div className={styles.emptyState} style={{ marginTop: '24px' }}>
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <p>Bạn chưa có chủ đề quan tâm nào. Hãy tương tác với các bài viết để thêm chủ đề!</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.interestsGrid}>
                            {interests.map(item => (
                                <div key={item.tag} className={styles.interestCard}>
                                    <button 
                                        className={styles.deleteInterestBtn}
                                        onClick={() => handleDelete(item.tag)}
                                        title="Bỏ quan tâm"
                                    >
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                    
                                    <div className={styles.interestTag}>#{item.tag}</div>
                                    
                                    <div className={styles.interestScore}>
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                        </svg>
                                        Độ quan tâm: {Math.round(item.score * 10) / 10}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button 
                                    className={styles.pageBtn} 
                                    onClick={handlePrevPage} 
                                    disabled={page === 0}
                                >
                                    Trang trước
                                </button>
                                <span className={styles.pageInfo}>
                                    Trang {page + 1} / {totalPages}
                                </span>
                                <button 
                                    className={styles.pageBtn} 
                                    onClick={handleNextPage} 
                                    disabled={page >= totalPages - 1}
                                >
                                    Trang sau
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {tagToDelete && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h4>Xác nhận xóa</h4>
                        <p>Bạn có chắc chắn muốn bỏ quan tâm chủ đề "{tagToDelete}"?</p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setTagToDelete(null)} className={styles.cancelBtn}>Hủy</button>
                            <button onClick={confirmDelete} className={styles.confirmBtn}>Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
