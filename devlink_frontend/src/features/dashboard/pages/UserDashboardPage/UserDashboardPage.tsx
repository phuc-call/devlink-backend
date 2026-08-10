import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { userProfileApi } from '../../../../api/user-service/userProfileApi';
import styles from './UserDashboardPage.module.css';
import { Users, UserPlus, Shield, Bell, UsersRound, Award } from 'lucide-react';

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
            </Routes>
        </div>
    );
}

function ReactHistorySection() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchHistory = async (pageNumber: number) => {
        setLoading(true);
        try {
            // We import overviewPostApi dynamically or assume it's imported at the top
            // Since this is inside the same file, we need to import it at the top of the file
            // Let's use the API
            const { overviewPostApi } = await import('../../../../api/post-service/overviewPostApi');
            const res = await overviewPostApi.getReactHistory(pageNumber, 10);
            if (res.data.success) {
                setHistory(res.data.data.content);
                setTotalPages(res.data.data.totalPages);
            }
        } catch (error) {
            console.error('Failed to fetch react history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(page);
    }, [page]);

    const handlePrevPage = () => {
        if (page > 0) setPage(p => p - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) setPage(p => p + 1);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    return (
        <div className={styles.section}>
            
            {loading ? (
                <div className={styles.loadingContainer}>Loading history...</div>
            ) : history.length === 0 ? (
                <div className={styles.comingSoonBox}>
                    <p>You haven't reacted to any posts yet.</p>
                </div>
            ) : (
                <>
                    <div className={styles.historyList}>
                        {history.map(item => (
                            <div key={item.reactId} className={styles.historyItem}>
                                <div className={styles.historyHeader}>
                                    <span style={{ display: 'flex', alignItems: 'center' }}>
                                        {REACTION_ICONS[item.reactionType] || item.reactionType}
                                    </span>
                                    <span className={styles.historyDate}>{formatDate(item.createdAt)}</span>
                                </div>
                                <div className={styles.historyContent}>
                                    {item.postContent || <span style={{fontStyle: 'italic', color: '#9ca3af'}}>Media only post</span>}
                                </div>
                                <button 
                                    className={styles.viewPostBtn}
                                    onClick={() => window.open(`/post/${item.postId}`, '_blank')}
                                >
                                    View Post
                                </button>
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
                                Previous
                            </button>
                            <span className={styles.pageInfo}>
                                Page {page + 1} of {totalPages}
                            </span>
                            <button 
                                className={styles.pageBtn} 
                                onClick={handleNextPage} 
                                disabled={page >= totalPages - 1}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
