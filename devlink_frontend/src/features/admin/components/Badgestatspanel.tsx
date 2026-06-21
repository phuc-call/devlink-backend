import type { BadgeStatsResponse, BadgeType } from '../../../types/badge.types';
import { BADGE_LABELS, BADGE_COLORS } from '../../../types/badge.types';

interface Props {
    stats: BadgeStatsResponse | null;
    onFilterByBadge: (badge: BadgeType) => void;
}

const STATS_ITEMS: { key: keyof Omit<BadgeStatsResponse, 'total'>; badge: BadgeType }[] = [
    { key: 'none', badge: 'NONE' },
    { key: 'popular', badge: 'POPULAR' },
    { key: 'blueTick', badge: 'BLUE_TICK' },
    { key: 'redTick', badge: 'RED_TICK' },
];

export default function BadgeStatsPanel({ stats, onFilterByBadge }: Props) {
    if (!stats) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            <div style={{
                padding: '16px 20px', borderRadius: 16,
                background: '#F8FAFC', border: '1px solid #E2E8F0',
            }}>
                <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tổng cộng</div>
                <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: '#111827' }}>{stats.total.toLocaleString()}</div>
            </div>

            {STATS_ITEMS.map(({ key, badge }) => (
                <button
                    key={badge}
                    type="button"
                    onClick={() => onFilterByBadge(badge)}
                    style={{
                        padding: '16px 20px', borderRadius: 16, textAlign: 'left',
                        background: BADGE_COLORS[badge].bg,
                        border: `1px solid ${BADGE_COLORS[badge].border}`,
                        cursor: 'pointer',
                    }}
                >
                    <div style={{ fontSize: 12, color: BADGE_COLORS[badge].color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {BADGE_LABELS[badge]}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: '#111827' }}>
                        {stats[key].toLocaleString()}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: '#9CA3AF' }}>
                        {stats.total > 0 ? ((stats[key] / stats.total) * 100).toFixed(1) : 0}%
                    </div>
                </button>
            ))}
        </div>
    );
}