import { useEffect, useState } from 'react';
import { Settings, RefreshCw, Save, TrendingUp, Heart, Bookmark, Share2, Eye, Sliders, Filter } from 'lucide-react';
import { feedConfigApi } from '../../../api/post-service/feedConfigApi';
import type { FeedScoringConfigResponse } from '../../../api/post-service/feedConfigApi';

// ─── Meta: icon + color per config group ────────────────────────────────────
const CONFIG_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; hint: string }> = {
    'score.view':              { label: 'View Score',          icon: <Eye size={16} />,      color: '#0369A1', bg: '#E0F2FE', hint: 'Points added when a user views a post' },
    'score.like':              { label: 'Like Score',          icon: <Heart size={16} />,    color: '#BE185D', bg: '#FCE7F3', hint: 'Points added when a user likes a post' },
    'score.bookmark':          { label: 'Bookmark Score',      icon: <Bookmark size={16} />, color: '#7C3AED', bg: '#EDE9FE', hint: 'Points added when a user bookmarks a post' },
    'score.share':             { label: 'Share Score',         icon: <Share2 size={16} />,   color: '#0F766E', bg: '#CCFBF1', hint: 'Points added when a user shares a post' },
    'feed.top_tags_limit':     { label: 'Top Tags Limit',      icon: <TrendingUp size={16} />, color: '#B45309', bg: '#FEF3C7', hint: 'How many top-interest tags to fetch for feed generation' },
    'feed.min_like_threshold': { label: 'Min Like Threshold',  icon: <Filter size={16} />,   color: '#15803D', bg: '#DCFCE7', hint: 'Minimum likes a post must have to appear in the feed' },
    'feed.fallback_threshold': { label: 'Fallback Threshold',  icon: <Sliders size={16} />,  color: '#6B7280', bg: '#F3F4F6', hint: 'If personalized results are fewer than this, show trending instead' },
    'interest.decay_rate':     { label: 'Decay Rate',          icon: <Settings size={16} />, color: '#B91C1C', bg: '#FEE2E2', hint: 'Daily score multiplier (0.95 = 5% decay/day). Must be < 1.0' },
};

const GROUP_SCORE = ['score.view', 'score.like', 'score.bookmark', 'score.share'];
const GROUP_FEED  = ['feed.top_tags_limit', 'feed.min_like_threshold', 'feed.fallback_threshold', 'interest.decay_rate'];

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function AdminFeedConfigPage() {
    const [configs, setConfigs] = useState<FeedScoringConfigResponse[]>([]);
    const [editValues, setEditValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => { loadConfigs(); }, []);

    const loadConfigs = async () => {
        setLoading(true);
        try {
            const res = await feedConfigApi.getAll();
            const data = res.data.data;
            setConfigs(data);
            const initial: Record<string, string> = {};
            data.forEach(c => { initial[c.configKey] = String(c.configValue); });
            setEditValues(initial);
        } catch {
            showStatus('error', 'Failed to load feed scoring config.');
        } finally {
            setLoading(false);
        }
    };

    const showStatus = (type: 'success' | 'error', message: string) => {
        setStatus({ type, message });
        setTimeout(() => setStatus(null), 4000);
    };

    const handleSave = async (configKey: string) => {
        const raw = editValues[configKey];
        const value = parseFloat(raw);
        if (isNaN(value) || value <= 0) {
            showStatus('error', `Invalid value for "${configKey}". Must be a positive number.`);
            return;
        }
        if (configKey === 'interest.decay_rate' && value >= 1.0) {
            showStatus('error', 'Decay rate must be less than 1.0 (e.g. 0.95 means 5% daily decay).');
            return;
        }
        setSaving(prev => ({ ...prev, [configKey]: true }));
        try {
            await feedConfigApi.update({ configKey, configValue: value });
            showStatus('success', `"${CONFIG_META[configKey]?.label ?? configKey}" updated successfully.`);
            await loadConfigs();
        } catch {
            showStatus('error', `Failed to update "${configKey}".`);
        } finally {
            setSaving(prev => ({ ...prev, [configKey]: false }));
        }
    };

    const getConfig = (key: string) => configs.find(c => c.configKey === key);

    const renderCard = (key: string) => {
        const config = getConfig(key);
        const meta   = CONFIG_META[key];
        if (!config || !meta) return null;

        const isDirty = editValues[key] !== undefined && parseFloat(editValues[key]) !== config.configValue;

        return (
            <div key={key} style={{
                background: '#fff', borderRadius: 18, padding: 22,
                boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
                border: `1px solid ${isDirty ? '#BFDBFE' : '#F1F5F9'}`,
                transition: 'border-color 0.2s',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: meta.bg, display: 'grid', placeItems: 'center',
                        color: meta.color, flexShrink: 0,
                    }}>
                        {meta.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{meta.label}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{key}</div>
                    </div>
                    {isDirty && (
                        <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 8px',
                            borderRadius: 20, background: '#DBEAFE', color: '#1D4ED8',
                        }}>
                            unsaved
                        </span>
                    )}
                </div>

                {/* Hint */}
                <div style={{
                    fontSize: 12, color: '#6B7280', marginBottom: 14,
                    padding: '8px 12px', background: '#F9FAFB',
                    borderRadius: 10, borderLeft: `3px solid ${meta.color}`,
                }}>
                    {meta.hint}
                </div>

                {/* Input + Save */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                        id={`config-${key}`}
                        type="number"
                        step={key === 'interest.decay_rate' ? '0.01' : '0.5'}
                        min={0.01}
                        max={key === 'interest.decay_rate' ? 0.99 : 100}
                        value={editValues[key] ?? config.configValue}
                        onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                        style={{
                            flex: 1, padding: '10px 14px', borderRadius: 12,
                            border: `1px solid ${isDirty ? '#93C5FD' : '#E5E7EB'}`,
                            fontSize: 15, fontWeight: 700, color: '#111827',
                            outline: 'none', boxSizing: 'border-box',
                            background: isDirty ? '#EFF6FF' : '#fff',
                            transition: 'border-color 0.2s, background 0.2s',
                        }}
                    />
                    <button
                        type="button"
                        id={`save-${key}`}
                        onClick={() => handleSave(key)}
                        disabled={saving[key] || !isDirty}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '10px 16px', borderRadius: 12, border: 'none',
                            background: isDirty ? meta.color : '#F3F4F6',
                            color: isDirty ? '#fff' : '#9CA3AF',
                            cursor: isDirty ? 'pointer' : 'default',
                            fontWeight: 700, fontSize: 13,
                            transition: 'background 0.2s, color 0.2s',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <Save size={14} />
                        {saving[key] ? 'Saving...' : 'Save'}
                    </button>
                </div>

                {/* Last updated */}
                {config.updatedAt && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10 }}>
                        Last updated: {formatDate(config.updatedAt)}
                        {config.updatedBy && ` · by admin #${config.updatedBy}`}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
                        Feed Scoring Config
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                        Configure interest scoring weights and feed generation parameters.
                        Changes are cached in Redis and take effect within 10 minutes.
                    </p>
                </div>
                <button
                    type="button"
                    id="refresh-feed-config"
                    onClick={loadConfigs}
                    disabled={loading}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 16px', borderRadius: 10, flexShrink: 0,
                        background: '#F3F4F6', color: '#111827', border: '1px solid #E5E7EB',
                        cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    }}
                >
                    <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
                    Refresh
                </button>
            </div>

            {/* Status banner */}
            {status && (
                <div style={{
                    marginBottom: 20, padding: '13px 18px', borderRadius: 12,
                    background: status.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    color:      status.type === 'success' ? '#166534' : '#B91C1C',
                    border:    `1px solid ${status.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                    fontWeight: 600, fontSize: 13,
                }}>
                    {status.message}
                </div>
            )}

            {loading && configs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading config...</div>
            ) : (
                <>
                    {/* ── Section 1: Interaction Scores ───────────────────────── */}
                    <section style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 6, height: 22, borderRadius: 3, background: '#BE185D' }} />
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Interaction Scoring Weights</div>
                                <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                                    Points added to a user's interest score per interaction type.
                                    Higher = stronger signal.
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {GROUP_SCORE.map(renderCard)}
                        </div>
                    </section>

                    {/* ── Section 2: Feed Parameters ──────────────────────────── */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 6, height: 22, borderRadius: 3, background: '#0369A1' }} />
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Feed Generation Parameters</div>
                                <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                                    Control how the personalized feed is built and when it falls back to trending.
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {GROUP_FEED.map(renderCard)}
                        </div>
                    </section>
                </>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>
        </div>
    );
}
