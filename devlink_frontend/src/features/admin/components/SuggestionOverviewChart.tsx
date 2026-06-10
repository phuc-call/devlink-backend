// src/features/admin/components/SuggestionOverviewChart.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, RefreshCw, AlertCircle, Plus, X, Calendar } from 'lucide-react';
import { getSuggestionOverview } from '../../../api/post-service/suggestionApi';
import type { PeriodOverviewResponse, DatePointResponse } from '../../../types/suggestion.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const LINE_CONFIG = [
    { key: 'contentFix',     label: 'Sửa nội dung',    color: '#3B82F6' },
    { key: 'addExplanation', label: 'Thêm giải thích', color: '#22C55E' },
    { key: 'reportError',    label: 'Báo lỗi',         color: '#EF4444' },
    { key: 'other',          label: 'Khác',            color: '#F59E0B' },
] as const;

// Mỗi period có 1 bộ màu riêng để phân biệt khi so sánh
const PERIOD_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

type LineKey = typeof LINE_CONFIG[number]['key'];

const MAX_PERIODS = 5;
const MAX_DAYS    = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
    return new Date().toISOString().substring(0, 10);
}

function daysAgoStr(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().substring(0, 10);
}

function daysBetween(from: string, to: string): number {
    return Math.round(
        (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
    );
}

function fmtDateLabel(dateStr: string): string {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
}

function sumPeriod(period: PeriodOverviewResponse, key: LineKey): number {
    return period.data.reduce(
        (s, d) => s + (d[key as keyof DatePointResponse] as number),
        0,
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PeriodInput {
    id:   number;
    from: string;
    to:   string;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipPayloadItem {
    dataKey: string;
    name:    string;
    value:   number;
    color:   string;
}

interface CustomTooltipProps {
    active?:  boolean;
    payload?: TooltipPayloadItem[];
    label?:   string;
}

function CustomTooltip({ active, payload, label }: Readonly<CustomTooltipProps>) {
    if (!active || !payload?.length) return null;
    const nonZero = payload.filter(p => p.value > 0);
    if (!nonZero.length) return null;
    return (
        <div style={{
            background: '#fff', border: '1px solid #E5E7EB',
            borderRadius: 8, padding: '10px 14px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            fontFamily: "'Inter', sans-serif", minWidth: 170,
        }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                {label}
            </p>
            {payload.map((entry) => (
                <div key={entry.dataKey} style={{
                    display: 'flex', justifyContent: 'space-between',
                    gap: 16, fontSize: 12, marginBottom: 3,
                    opacity: entry.value === 0 ? 0.35 : 1,
                }}>
                    <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: entry.color, display: 'inline-block', flexShrink: 0,
                        }} />
                        {entry.name}
                    </span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{entry.value}</span>
                </div>
            ))}
        </div>
    );
}

// ─── PeriodInputRow ───────────────────────────────────────────────────────────

interface PeriodInputRowProps {
    readonly period:     PeriodInput;
    readonly index:      number;
    readonly color:      string;
    readonly canRemove:  boolean;
    readonly error?:     string;
    readonly onChange:   (id: number, field: 'from' | 'to', val: string) => void;
    readonly onRemove:   (id: number) => void;
}

function PeriodInputRow({ period, index, color, canRemove, error, onChange, onRemove }: PeriodInputRowProps) {
    const today = todayStr();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${error ? '#FCA5A5' : '#E5E7EB'}`,
                background: error ? '#FEF2F2' : '#F9FAFB',
            }}>
                {/* Color dot + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: color, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', minWidth: 32 }}>
                        Kỳ {index + 1}
                    </span>
                </div>

                <Calendar size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />

                {/* From */}
                <input
                    type="date"
                    value={period.from}
                    max={period.to || today}
                    onChange={e => onChange(period.id, 'from', e.target.value)}
                    style={dateInputStyle}
                />

                <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>→</span>

                {/* To */}
                <input
                    type="date"
                    value={period.to}
                    min={period.from}
                    max={today}
                    onChange={e => onChange(period.id, 'to', e.target.value)}
                    style={dateInputStyle}
                />

                {/* Day count badge */}
                {period.from && period.to && (
                    <span style={{
                        fontSize: 11, color: '#6B7280',
                        background: '#F3F4F6', borderRadius: 9999,
                        padding: '2px 7px', flexShrink: 0,
                    }}>
                        {daysBetween(period.from, period.to) + 1} ngày
                    </span>
                )}

                {/* Remove */}
                {canRemove && (
                    <button
                        onClick={() => onRemove(period.id)}
                        title="Xóa kỳ này"
                        style={{
                            marginLeft: 'auto', background: 'none', border: 'none',
                            cursor: 'pointer', color: '#9CA3AF', padding: 2,
                            display: 'flex', alignItems: 'center',
                            borderRadius: 4,
                        }}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            {error && (
                <span style={{ fontSize: 11, color: '#EF4444', paddingLeft: 8 }}>{error}</span>
            )}
        </div>
    );
}

// ─── StatPill ─────────────────────────────────────────────────────────────────

interface StatPillProps {
    readonly cfg:      typeof LINE_CONFIG[number];
    readonly total:    number;
    readonly active:   boolean;
    readonly onToggle: () => void;
}

function StatPill({ cfg, total, active, onToggle }: StatPillProps) {
    return (
        <button onClick={onToggle} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 9999,
            border: `1px solid ${active ? cfg.color + '40' : '#E5E7EB'}`,
            background: active ? cfg.color + '12' : '#F9FAFB',
            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            opacity: active ? 1 : 0.4, transition: 'all 0.15s',
        }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#374151' }}>{cfg.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{total.toLocaleString()}</span>
        </button>
    );
}

// ─── Validate ────────────────────────────────────────────────────────────────

function validateInputs(inputs: PeriodInput[]): Record<number, string> {
    const errors: Record<number, string> = {};
    const today = todayStr();
    inputs.forEach(p => {
        if (!p.from || !p.to) {
            errors[p.id] = 'Vui lòng chọn đủ ngày bắt đầu và kết thúc';
            return;
        }
        if (p.from > p.to) {
            errors[p.id] = 'Ngày bắt đầu phải trước ngày kết thúc';
            return;
        }
        if (p.to > today) {
            errors[p.id] = 'Ngày kết thúc không được vượt quá hôm nay';
            return;
        }
        const days = daysBetween(p.from, p.to);
        if (days > MAX_DAYS) {
            errors[p.id] = `Tối đa ${MAX_DAYS} ngày mỗi kỳ (hiện tại: ${days + 1} ngày)`;
        }
    });
    return errors;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

let nextId = 2;

export default function SuggestionOverviewChart() {
    const [periodInputs,  setPeriodInputs]  = useState<PeriodInput[]>([
        { id: 1, from: daysAgoStr(29), to: todayStr() },
    ]);
    const [inputErrors,   setInputErrors]   = useState<Record<number, string>>({});
    const [results,       setResults]       = useState<PeriodOverviewResponse[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState<string | null>(null);
    const [visibleLines,  setVisibleLines]  = useState<Set<LineKey>>(
        () => new Set(LINE_CONFIG.map(l => l.key)),
    );
    // single period mode: show breakdown tabs; multi: show by type per period
    const [activeTypeKey, setActiveTypeKey] = useState<LineKey>('contentFix');

    const isMounted = useRef(true);

    async function fetchData(inputs?: PeriodInput[]): Promise<void> {
        const targets = inputs ?? periodInputs;
        const errs    = validateInputs(targets);
        if (Object.keys(errs).length) {
            setInputErrors(errs);
            return;
        }
        setInputErrors({});
        setLoading(true);
        setError(null);
        try {
            const res = await getSuggestionOverview({
                periods: targets.map(p => ({ from: p.from, to: p.to })),
            });
            if (!isMounted.current) return;
            setResults(res);
        } catch (e: unknown) {
            if (!isMounted.current) return;
            const msg =
                (e as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? 'Không thể tải dữ liệu';
            setError(msg);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        isMounted.current = true;
        void fetchData();
        return () => { isMounted.current = false; };
    }, []);

    // ── Period input handlers ──
    const handleInputChange = (id: number, field: 'from' | 'to', val: string) => {
        setPeriodInputs(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
        setInputErrors(prev => { const next = { ...prev }; delete next[id]; return next; });
    };

    const addPeriod = () => {
        if (periodInputs.length >= MAX_PERIODS) return;
        setPeriodInputs(prev => [
            ...prev,
            { id: nextId++, from: daysAgoStr(59), to: daysAgoStr(30) },
        ]);
    };

    const removePeriod = (id: number) => {
        setPeriodInputs(prev => prev.filter(p => p.id !== id));
        setInputErrors(prev => { const next = { ...prev }; delete next[id]; return next; });
    };

    const toggleLine = (key: LineKey) => {
        setVisibleLines(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                if (next.size === 1) return prev;
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // ── Chart data builder ──
    const isMultiPeriod = results.length > 1;

    // Single period: 4 lines (one per type), x = date
    const singleChartData = results[0]?.data.map(d => ({
        ...d,
        date: fmtDateLabel(d.date),
    })) ?? [];

    // Multi period: 1 active type, lines = periods, x = relative day index
    const multiChartData = (() => {
        if (!isMultiPeriod) return [];
        const maxLen = Math.max(...results.map(r => r.data.length));
        return Array.from({ length: maxLen }, (_, i) => {
            const point: Record<string, string | number> = { day: `N+${i}` };
            results.forEach((r, pi) => {
                const d = r.data[i];
                point[`period_${pi}`] = d
                    ? (d[activeTypeKey as keyof DatePointResponse] as number)
                    : 0;
            });
            return point;
        });
    })();

    // ── Totals for stat pills (sum across all results) ──
    const totals = LINE_CONFIG.map(l => ({
        ...l,
        total: results.reduce((s, r) => s + sumPeriod(r, l.key), 0),
    }));

    // ── Render chart inner ──
    const renderChart = (): React.ReactElement => {
        if (loading) return (
            <div style={centerStyle}>
                <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '3px solid #DBEAFE', borderTopColor: '#3B82F6',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ fontSize: 13, color: '#6B7280', marginTop: 10 }}>Đang tải...</span>
            </div>
        );

        if (error) return (
            <div style={centerStyle}>
                <AlertCircle size={26} color="#EF4444" />
                <span style={{ fontSize: 13, color: '#6B7280', marginTop: 8 }}>{error}</span>
                <button onClick={() => { void fetchData(); }} style={retryStyle}>Thử lại</button>
            </div>
        );

        if (!results.length) return (
            <div style={centerStyle}>
                <TrendingUp size={26} color="#D1D5DB" />
                <span style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>Chưa có dữ liệu — nhấn "Xem biểu đồ"</span>
            </div>
        );

        if (isMultiPeriod) {
            // Multi-period: 1 chart per type tab, lines = each period
            return (
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={multiChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter' }}
                            axisLine={false} tickLine={false}
                            interval={Math.max(0, Math.floor(multiChartData.length / 6) - 1)}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter' }}
                            axisLine={false} tickLine={false} allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            formatter={(value: string) => {
                                const idx = parseInt(value.replace('period_', ''));
                                const r   = results[idx];
                                return (
                                    <span style={{ fontSize: 11, color: '#374151' }}>
                                        {r ? `${r.from} → ${r.to}` : value}
                                    </span>
                                );
                            }}
                            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        />
                        {results.map((r, i) => (
                            <Line
                                key={r.from + r.to}
                                type="monotone"
                                dataKey={`period_${i}`}
                                name={`period_${i}`}
                                stroke={PERIOD_COLORS[i % PERIOD_COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            );
        }

        // Single period: 4 lines by type
        return (
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={singleChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter' }}
                        axisLine={false} tickLine={false}
                        interval={Math.max(0, Math.floor(singleChartData.length / 6) - 1)}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter' }}
                        axisLine={false} tickLine={false} allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {LINE_CONFIG.map(l => visibleLines.has(l.key) && (
                        <Line
                            key={l.key}
                            type="monotone"
                            dataKey={l.key}
                            name={l.label}
                            stroke={l.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div style={{
            background: '#FFFFFF', borderRadius: 8,
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            fontFamily: "'Inter', sans-serif", overflow: 'hidden',
        }}>
            {/* ── Header ── */}
            <div style={{
                padding: '14px 20px', borderBottom: '1px solid #F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8, background: '#EFF6FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <TrendingUp size={16} color="#3B82F6" />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                            Hoạt động góp ý theo ngày
                        </div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                            Chọn kỳ thời gian để xem và so sánh
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => { void fetchData(); }}
                    disabled={loading}
                    title="Làm mới"
                    style={{
                        background: 'none', border: '1px solid #E5E7EB',
                        borderRadius: 6, width: 30, height: 30,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        color: '#6B7280', opacity: loading ? 0.5 : 1,
                    }}
                >
                    <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
                </button>
            </div>

            {/* ── Period inputs ── */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {periodInputs.map((p, i) => (
                        <PeriodInputRow
                            key={p.id}
                            period={p}
                            index={i}
                            color={PERIOD_COLORS[i % PERIOD_COLORS.length]}
                            canRemove={periodInputs.length > 1}
                            error={inputErrors[p.id]}
                            onChange={handleInputChange}
                            onRemove={removePeriod}
                        />
                    ))}
                </div>

                {/* Footer actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <button
                        onClick={addPeriod}
                        disabled={periodInputs.length >= MAX_PERIODS}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 6,
                            border: '1px dashed #D1D5DB',
                            background: 'none', cursor: periodInputs.length >= MAX_PERIODS ? 'not-allowed' : 'pointer',
                            color: periodInputs.length >= MAX_PERIODS ? '#D1D5DB' : '#6B7280',
                            fontSize: 12, fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        <Plus size={13} />
                        Thêm kỳ so sánh
                        <span style={{
                            fontSize: 10, color: '#9CA3AF',
                            background: '#F3F4F6', borderRadius: 9999, padding: '1px 5px',
                        }}>
                            {periodInputs.length}/{MAX_PERIODS}
                        </span>
                    </button>

                    <button
                        onClick={() => { void fetchData(); }}
                        disabled={loading}
                        style={{
                            padding: '6px 16px', borderRadius: 6,
                            background: loading ? '#DBEAFE' : '#3B82F6',
                            color: '#fff', border: 'none',
                            fontSize: 13, fontWeight: 500,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: "'Inter', sans-serif",
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        {loading && (
                            <div style={{
                                width: 12, height: 12, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.4)',
                                borderTopColor: '#fff',
                                animation: 'spin 0.8s linear infinite',
                            }} />
                        )}
                        Xem biểu đồ
                    </button>
                </div>
            </div>

            {/* ── Stat pills (single period) ── */}
            {!loading && !error && results.length === 1 && (
                <div style={{
                    padding: '10px 20px', display: 'flex', gap: 8,
                    flexWrap: 'wrap', borderBottom: '1px solid #F3F4F6',
                }}>
                    {totals.map(t => (
                        <StatPill
                            key={t.key}
                            cfg={t}
                            total={t.total}
                            active={visibleLines.has(t.key)}
                            onToggle={() => toggleLine(t.key)}
                        />
                    ))}
                </div>
            )}

            {/* ── Type tabs (multi period) ── */}
            {!loading && !error && isMultiPeriod && (
                <div style={{
                    padding: '10px 20px', display: 'flex', gap: 6,
                    flexWrap: 'wrap', borderBottom: '1px solid #F3F4F6',
                    alignItems: 'center',
                }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF', marginRight: 4 }}>Hiển thị:</span>
                    {LINE_CONFIG.map(l => (
                        <button
                            key={l.key}
                            onClick={() => setActiveTypeKey(l.key)}
                            style={{
                                padding: '4px 12px', borderRadius: 9999,
                                border: `1px solid ${activeTypeKey === l.key ? l.color + '60' : '#E5E7EB'}`,
                                background: activeTypeKey === l.key ? l.color + '14' : '#F9FAFB',
                                color: activeTypeKey === l.key ? l.color : '#6B7280',
                                fontSize: 12, fontWeight: activeTypeKey === l.key ? 600 : 400,
                                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                                display: 'flex', alignItems: 'center', gap: 5,
                            }}
                        >
                            <span style={{
                                width: 7, height: 7, borderRadius: '50%', background: l.color,
                            }} />
                            {l.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Chart ── */}
            <div style={{ padding: '12px 20px 16px' }}>
                {!loading && !error && results.length > 0 && (
                    <div style={{
                        display: 'flex', gap: 6, flexWrap: 'wrap',
                        marginBottom: 10, alignItems: 'center',
                    }}>
                        {results.map((r, i) => (
                            <span key={`${r.from}-${r.to}`} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: '#F9FAFB', borderRadius: 9999,
                                border: `1px solid ${PERIOD_COLORS[i % PERIOD_COLORS.length]}30`,
                                padding: '2px 9px', fontSize: 11,
                                color: PERIOD_COLORS[i % PERIOD_COLORS.length],
                                fontWeight: 500,
                            }}>
                                <span style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: PERIOD_COLORS[i % PERIOD_COLORS.length],
                                }} />
                                {r.from} → {r.to}
                                <span style={{ color: '#9CA3AF', fontWeight: 400 }}>
                                    · {r.data.length} ngày
                                </span>
                            </span>
                        ))}
                    </div>
                )}
                <div style={{ height: 220 }}>{renderChart()}</div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const centerStyle: React.CSSProperties = {
    height: 220, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
};

const retryStyle: React.CSSProperties = {
    marginTop: 10, padding: '6px 16px',
    background: '#3B82F6', color: '#fff',
    border: 'none', borderRadius: 6,
    fontSize: 13, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
};

const dateInputStyle: React.CSSProperties = {
    fontSize: 12, color: '#374151',
    border: 'none', background: 'none',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer', outline: 'none',
    padding: 0,
};