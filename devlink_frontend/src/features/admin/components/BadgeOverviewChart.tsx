import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
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
    fill: string;
}

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
            fill: BADGE_COLORS[badge].color
        }))
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
                    Quản lý Badge
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
                <div style={{ width: '100%', height: 240, marginTop: 16 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis 
                                type="category" 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#4B5563', fontSize: 13, fontWeight: 600 }} 
                                width={120} 
                            />
                            <Tooltip 
                                cursor={{ fill: '#F3F4F6', opacity: 0.6 }} 
                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
                                formatter={(value: number) => [`${value.toLocaleString()} người`, 'Số lượng']} 
                            />
                            <Bar 
                                dataKey="value" 
                                radius={[0, 8, 8, 0]} 
                                barSize={28}
                                onClick={(entry: SliceDatum) => goToBadge(entry.badge)} 
                                cursor="pointer"
                                background={{ fill: '#F3F4F6', radius: [0, 8, 8, 0] }}
                            >
                                {data.map(entry => (
                                    <Cell key={entry.badge} fill={entry.fill} />
                                ))}
                                <LabelList 
                                    dataKey="value" 
                                    position="right" 
                                    formatter={(val: number) => val.toLocaleString()}
                                    style={{ fill: '#111827', fontSize: 14, fontWeight: 700 }} 
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
