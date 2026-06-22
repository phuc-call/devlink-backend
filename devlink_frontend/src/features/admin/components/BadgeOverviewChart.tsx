import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Award } from 'lucide-react';
import { badgeApi } from '../../../api/user-service/badgeApi';
import type { BadgeStatsResponse, BadgeType } from '../../../types/badge.types';
import { BADGE_LABELS, BADGE_COLORS } from '../../../types/badge.types';

const SLICES: { key: keyof Omit<BadgeStatsResponse, 'total'>; badge: BadgeType }[] = [
    { key: 'none', badge: 'NONE' },
    { key: 'popular', badge: 'POPULAR' },
    { key: 'blueTick', badge: 'BLUE_TICK' },
    { key: 'redTick', badge: 'RED_TICK' },
];

interface SliceDatum {
    name: string;
    value: number;
    badge: BadgeType;
}

/**
 * Thống kê badge dạng donut chart cho Dashboard admin.
 * Dùng lại đúng API GET /api/users/admin/badges/stats (badgeApi.getBadgeStats) —
 * không thêm logic backend mới, không tự suy diễn số liệu.
 * Bấm vào lát cắt / dòng chú thích sẽ điều hướng sang trang Quản lý Badge,
 * kèm query param ?badge=... để trang đó tự lọc đúng badge vừa chọn.
 */
export default function BadgeOverviewChart() {
    const [stats, setStats] = useState<BadgeStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        badgeApi.getBadgeStats()
            .then(res => setStats(res.data.data))
            .catch(err => {
                console.error(err);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, []);

    const goToBadge = (badge: BadgeType) => {
        navigate(`/admin/badges?badge=${badge}`);
    };

    const data: SliceDatum[] = stats
        ? SLICES.map(({ key, badge }) => ({
            name: BADGE_LABELS[badge],
            value: stats[key],
            badge,
        })).filter(d => d.value > 0)
        : [];

    return (
        <div style={{
            background: '#fff', borderRadius: 20, padding: 24,
            border: '1px solid #E5E7EB',
            boxShadow: '0 16px 40px rgba(15,23,42,0.04)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, background: '#F0FDF4', display: 'grid', placeItems: 'center' }}>
                        <Award size={20} color="#15803D" />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Thống kê Badge</div>
                        <div style={{ fontSize: 13, color: '#6B7280' }}>Bấm vào biểu đồ để xem chi tiết user theo badge.</div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/admin/badges')}
                    style={{ border: 'none', background: '#F3F4F6', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#374151', fontWeight: 600, fontSize: 13 }}
                >
                    Quản lý Badge →
                </button>
            </div>

            {loading && <div style={{ color: '#6B7280', padding: 24, textAlign: 'center' }}>Đang tải...</div>}

            {!loading && error && (
                <div style={{ color: '#B91C1C', padding: 24, textAlign: 'center', fontSize: 13 }}>
                    Không tải được thống kê badge.
                </div>
            )}

            {!loading && !error && stats && data.length === 0 && (
                <div style={{ color: '#9CA3AF', padding: 24, textAlign: 'center', fontSize: 13 }}>
                    Chưa có dữ liệu badge.
                </div>
            )}

            {!loading && !error && stats && data.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ width: 200, height: 200, position: 'relative', flexShrink: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={55}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    cursor="pointer"
                                    onClick={(entry: SliceDatum) => goToBadge(entry.badge)}
                                >
                                    {data.map(entry => (
                                        <Cell key={entry.badge} fill={BADGE_COLORS[entry.badge].color} stroke="#fff" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number, name: string) => [`${value.toLocaleString()} user`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tổng</div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{stats.total.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: 8, flex: 1, minWidth: 180 }}>
                        {SLICES.map(({ key, badge }) => (
                            <button
                                key={badge}
                                type="button"
                                onClick={() => goToBadge(badge)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    gap: 10, padding: '8px 12px', borderRadius: 10,
                                    background: BADGE_COLORS[badge].bg,
                                    border: `1px solid ${BADGE_COLORS[badge].border}`,
                                    cursor: 'pointer', textAlign: 'left',
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: BADGE_COLORS[badge].color, display: 'inline-block' }} />
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{BADGE_LABELS[badge]}</span>
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{stats[key].toLocaleString()}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
