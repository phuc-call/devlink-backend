// src/features/admin/components/TemplateOverviewSection.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Cell, ResponsiveContainer,
    PieChart, Pie, Legend,
} from 'recharts';
import { RefreshCw, AlertCircle, Eye, GitFork, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { getTemplateOverview } from '../../../api/post-service/learningTemplateApi';
import type { OverviewOfTemplate } from '../../../types/template.types';
import styles from './TemplateOverviewSection.module.css';

// ─── Color Generator (từ API keys, không hardcode tên ngôn ngữ) ───────────────

const BASE_PALETTE = [
    '#2563EB', '#F59E0B', '#10B981', '#EF4444',
    '#8B5CF6', '#06B6D4', '#F97316', '#6366F1',
    '#EC4899', '#84CC16', '#14B8A6', '#E11D48',
];

function buildColorMap(keys: string[]): Record<string, string> {
    return Object.fromEntries(
        keys.map((k, i) => [k, BASE_PALETTE[i % BASE_PALETTE.length]])
    );
}

/** Chuyển màu hex sang pastel opacity 15% để dùng làm nền badge */
function hexToSoftBg(hex: string): string {
    return hex + '1F'; // ~12% opacity
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(val: unknown): string {
    if (!val) return '—';
    return new Date(val as string).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

function mapToArr(obj: Record<string, number> | undefined) {
    if (!obj) return [];
    return Object.entries(obj).map(([name, value]) => ({ name, value }));
}

interface ItemRow {
    id: number;
    title: string;
    language: string;
    difficulty: string;
    fileType: string;
    status: string;
    viewCount: number;
    forkCount: number;
    createdAt: string;
}

const PAGE_INIT = 3;   // hiển thị đầu
const PAGE_STEP = 10;  // mỗi lần "Xem thêm"

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return <span className={`${styles.rankBadge} ${styles.rankGold}`}>🥇</span>;
    if (rank === 2) return <span className={`${styles.rankBadge} ${styles.rankSilver}`}>🥈</span>;
    if (rank === 3) return <span className={`${styles.rankBadge} ${styles.rankBronze}`}>🥉</span>;
    return <span className={styles.tdMuted}>{rank}</span>;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className={styles.tooltip}>
            <p className={styles.tooltipLabel}>{label}</p>
            <p className={styles.tooltipVal}>{payload[0].value.toLocaleString()}</p>
        </div>
    );
}

// ─── Bar Chart Card ───────────────────────────────────────────────────────────

function BarCard({ title, data, colorMap }: {
    title: string;
    data: { name: string; value: number }[];
    colorMap: Record<string, string>;
}) {
    return (
        <div className={styles.chartCard}>
            <p className={styles.chartCardTitle}>{title}</p>
            <ResponsiveContainer width="100%" height={150}>
                <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F9FAFB' }} />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                        {data.map(entry => (
                            <Cell key={entry.name} fill={colorMap[entry.name] ?? '#6B7280'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <div className={styles.langLegend}>
                {data.map(entry => (
                    <span key={entry.name} className={styles.langDot}>
                        <span className={styles.langDotCircle}
                              style={{ background: colorMap[entry.name] ?? '#6B7280' }} />
                        {entry.name}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── Donut Card ───────────────────────────────────────────────────────────────

function DonutCard({ title, data, colorMap }: {
    title: string;
    data: { name: string; value: number }[];
    colorMap: Record<string, string>;
}) {
    const colors = data.map(d => colorMap[d.name] ?? '#6B7280');
    return (
        <div className={styles.chartCard}>
            <p className={styles.chartCardTitle}>{title}</p>
            <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={56}
                        paddingAngle={3}
                        dataKey="value"
                    >
                        {data.map((entry, i) => (
                            <Cell key={entry.name} fill={colors[i]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => v.toLocaleString()} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Items Table ──────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; cls: string }> = {
    ACTIVE:  { label: 'Hoạt động', cls: 'badgeActive'  },
    HIDDEN:  { label: 'Đã ẩn',     cls: 'badgeHidden'  },
    DELETED: { label: 'Đã xóa',    cls: 'badgeDeleted' },
};

function ItemsTable({ items, langColorMap, diffColorMap }: {
    items: ItemRow[];
    langColorMap: Record<string, string>;
    diffColorMap: Record<string, string>;
}) {
    const [visibleCount, setVisibleCount] = useState(PAGE_INIT);
    const visible = items.slice(0, visibleCount);
    const hasMore = visibleCount < items.length;
    const isExpanded = visibleCount > PAGE_INIT;

    if (!items.length) return null;

    return (
        <div className={styles.tableWrap}>
            {/* Table header */}
            <div className={styles.tableHeader}>
                <span className={styles.tableTitle}>
                    Chi tiết từng template
                </span>
                <span className={styles.tableCount}>
                    Hiển thị {visible.length} / {items.length} mục
                </span>
            </div>

            <div className={styles.tableScroll}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th style={{ width: 42, textAlign: 'center' }}>#</th>
                        <th>Tên template</th>
                        <th>Ngôn ngữ</th>
                        <th>Độ khó</th>
                        <th>Loại file</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: 'right' }}>
                            <Eye size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                            Views
                        </th>
                        <th style={{ textAlign: 'right' }}>
                            <GitFork size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                            Forks
                        </th>
                        <th>Ngày tạo</th>
                    </tr>
                    </thead>
                    <tbody>
                    {visible.map((item, idx) => {
                        const sm = STATUS_META[item.status] ?? { label: item.status, cls: 'badgeActive' };
                        const lc = langColorMap[item.language] ?? '#6B7280';
                        const dc = diffColorMap[item.difficulty] ?? '#6B7280';
                        return (
                            <tr key={item.id}>
                                {/* Rank badge */}
                                <td className={styles.tdCenter}>
                                    <RankBadge rank={idx + 1} />
                                </td>

                                <td className={styles.tdTitle}>{item.title}</td>

                                {/* Language — màu khớp chart, nền pastel */}
                                <td>
                                        <span className={styles.badgeLang}
                                              style={{
                                                  background: hexToSoftBg(lc),
                                                  color: lc,
                                              }}>
                                            {item.language}
                                        </span>
                                </td>

                                {/* Difficulty — màu khớp chart, nền pastel */}
                                <td>
                                        <span className={styles.badgeDiff}
                                              style={{
                                                  background: hexToSoftBg(dc),
                                                  color: dc,
                                              }}>
                                            {item.difficulty}
                                        </span>
                                </td>

                                <td className={styles.tdMuted}>{item.fileType}</td>

                                {/* Status — pastel fixed tones */}
                                <td>
                                        <span className={`${styles.badge} ${styles[sm.cls]}`}>
                                            {sm.label}
                                        </span>
                                </td>

                                <td className={styles.tdNum}>
                                    {(item.viewCount ?? 0).toLocaleString()}
                                </td>
                                <td className={styles.tdNum}>
                                    {(item.forkCount ?? 0).toLocaleString()}
                                </td>
                                <td className={styles.tdMuted}>{formatDate(item.createdAt)}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Show more / collapse */}
            {(hasMore || isExpanded) && (
                <div className={styles.showMoreWrap}>
                    {hasMore ? (
                        <button
                            className={styles.btnShowMore}
                            onClick={() => setVisibleCount(c => Math.min(c + PAGE_STEP, items.length))}
                        >
                            <ChevronDown size={13} />
                            Xem thêm ({Math.min(PAGE_STEP, items.length - visibleCount)} mục)
                        </button>
                    ) : (
                        <button
                            className={styles.btnShowMore}
                            onClick={() => setVisibleCount(PAGE_INIT)}
                        >
                            <ChevronUp size={13} />
                            Thu gọn
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TemplateOverviewSection() {
    const [data, setData]       = useState<OverviewOfTemplate | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getTemplateOverview(undefined, undefined);
            setData(result);
        } catch {
            setError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchData(); }, [fetchData]);

    // ── Derive color maps từ API keys (không hardcode) ──
    const langColorMap = useMemo(() =>
            buildColorMap(Object.keys((data?.byLanguage  ?? {}) as Record<string,number>)),
        [data]
    );
    const fileColorMap = useMemo(() =>
            buildColorMap(Object.keys((data?.byFileType  ?? {}) as Record<string,number>)),
        [data]
    );
    const diffColorMap = useMemo(() =>
            buildColorMap(Object.keys((data?.byDifficulty ?? {}) as Record<string,number>)),
        [data]
    );

    const langData = mapToArr(data?.byLanguage   as Record<string,number> | undefined);
    const fileData = mapToArr(data?.byFileType   as Record<string,number> | undefined);
    const diffData = mapToArr(data?.byDifficulty as Record<string,number> | undefined);

    // Items đã sort theo viewCount desc (top performers lên đầu)
    const items = useMemo(() =>
            [...((data?.items ?? []) as unknown as ItemRow[])]
                .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)),
        [data]
    );

    const statCards = data ? [
        { label: 'Tổng template',  value: data.overviewTemplate, color: '#2563EB', icon: <TrendingUp size={14}/> },
        { label: 'Đang hoạt động', value: data.overviewAction,   color: '#059669', icon: <TrendingUp size={14}/> },
        { label: 'Đã ẩn',          value: data.overviewHidden,   color: '#B45309', icon: <TrendingUp size={14}/> },
        { label: 'Lượt xem',       value: data.overviewWatch,    color: '#7C3AED', icon: <Eye        size={14}/> },
        { label: 'Lượt fork',      value: data.overviewFork,     color: '#0891B2', icon: <GitFork    size={14}/> },
        { label: 'Loại file',      value: data.overviewFileType, color: '#DB2777', icon: <TrendingUp size={14}/> },
    ] : [];

    return (
        <div className={styles.wrap}>

            {/* Header */}
            <div className={styles.header}>
                <div>
                    <p className={styles.title}>Tổng quan Template</p>
                    {data && (
                        <p className={styles.subtitle}>
                            {formatDate(data.overviewOldDate as unknown as string)}
                            {' – '}
                            {formatDate(data.overviewNewDate as unknown as string)}
                        </p>
                    )}
                </div>
                <button className={styles.refreshBtn} onClick={() => void fetchData()}
                        disabled={loading} aria-label="Tải lại">
                    <RefreshCw size={13} className={loading ? styles.spinning : ''} />
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className={styles.errorBox} role="alert">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                    <button className={styles.btnRetry} onClick={() => void fetchData()}>Thử lại</button>
                </div>
            )}

            {/* Skeleton */}
            {loading && (
                <>
                    <div className={styles.skStatGrid}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className={`${styles.sk} ${styles.skStat}`} />
                        ))}
                    </div>
                    <div className={styles.skChartGrid}>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={`${styles.sk} ${styles.skChart}`} />
                        ))}
                    </div>
                    <div className={`${styles.sk} ${styles.skTable}`} />
                </>
            )}

            {/* Stat Cards */}
            {!loading && data && (
                <div className={styles.statGrid}>
                    {statCards.map(s => (
                        <div key={s.label} className={styles.statCard}
                             style={{ borderTop: `3px solid ${s.color}` }}>
                            <span className={styles.statLabel}>{s.label}</span>
                            <span className={styles.statVal} style={{ color: s.color }}>
                                {(s.value as number).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts */}
            {!loading && data && (
                <div className={styles.chartGrid}>
                    <BarCard   title="Theo ngôn ngữ" data={langData} colorMap={langColorMap} />
                    <DonutCard title="Theo loại file" data={fileData} colorMap={fileColorMap} />
                    <BarCard   title="Theo độ khó"   data={diffData} colorMap={diffColorMap} />
                </div>
            )}

            {/* Items Table — sorted by viewCount, top 3 default */}
            {!loading && data && (
                <ItemsTable
                    items={items}
                    langColorMap={langColorMap}
                    diffColorMap={diffColorMap}
                />
            )}
        </div>
    );
}