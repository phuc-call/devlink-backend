import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { userProfileApi } from '../../../../api/user-service/userProfileApi';
import styles from './UserDashboardPage.module.css';
import { Users, UserPlus, Bell, UsersRound } from 'lucide-react';
import ReactHistorySection from '../../components/ReactHistorySection';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];



export default function UserDashboardPage() {
    const [overview, setOverview] = useState<any>(null);
    const [loading, setLoading] = useState(false);

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
                                                {followData.map((_, index) => (
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
                                                {statsData.map((_, index) => (
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
