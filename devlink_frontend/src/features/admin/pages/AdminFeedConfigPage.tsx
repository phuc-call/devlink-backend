import { useCallback, useEffect, useState } from 'react';
import { Settings, RefreshCw, Save, TrendingUp, Heart, Bookmark, Share2, Eye, Sliders, Filter, Info } from 'lucide-react';
import { feedConfigApi } from '../../../api/post-service/feedConfigApi';
import type { FeedScoringConfigResponse } from '../../../api/post-service/feedConfigApi';

const CONFIG_META: Record<string, { label: string; icon: React.ReactNode; hint: string }> = {
    'score.view':              { label: 'Điểm Lượt Xem',          icon: <Eye size={16} />,      hint: 'Điểm cộng thêm khi người dùng xem bài viết' },
    'score.like':              { label: 'Điểm Yêu Thích',          icon: <Heart size={16} />,    hint: 'Điểm cộng thêm khi người dùng thích bài viết' },
    'score.bookmark':          { label: 'Điểm Lưu',      icon: <Bookmark size={16} />, hint: 'Điểm cộng thêm khi người dùng lưu bài viết' },
    'score.share':             { label: 'Điểm Chia Sẻ',         icon: <Share2 size={16} />,   hint: 'Điểm cộng thêm khi người dùng chia sẻ bài viết' },
    'feed.top_tags_limit':     { label: 'Giới Hạn Tag',      icon: <TrendingUp size={16} />, hint: 'Số lượng tag được quan tâm nhiều nhất để tạo feed' },
    'feed.min_like_threshold': { label: 'Số Like Tối Thiểu',  icon: <Filter size={16} />,   hint: 'Số lượng like tối thiểu để bài viết xuất hiện trên feed Trending' },
    'feed.fallback_threshold': { label: 'Ngưỡng Chuyển Đổi',  icon: <Sliders size={16} />,  hint: 'Nếu kết quả cá nhân hóa ít hơn số này, chuyển sang hiển thị trending' },
    'interest.decay_rate':     { label: 'Tỷ Lệ Giảm Điểm',          icon: <Settings size={16} />, hint: 'Hệ số nhân điểm hàng ngày (0.95 = giảm 5%/ngày). Phải < 1.0' },
};

const GROUP_SCORE = ['score.view', 'score.like', 'score.bookmark', 'score.share'];
const GROUP_FEED  = ['feed.top_tags_limit', 'feed.min_like_threshold', 'feed.fallback_threshold', 'interest.decay_rate'];

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminFeedConfigPage() {
    const [showHelp, setShowHelp] = useState(false);
    const [configs, setConfigs] = useState<FeedScoringConfigResponse[]>([]);
    const [editValues, setEditValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const loadConfigs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await feedConfigApi.getAll();
            const data = res.data?.data ?? [];
            setConfigs(data);
            const initial: Record<string, string> = {};
            data.forEach(c => { initial[c.configKey] = String(c.configValue); });
            setEditValues(initial);
        } catch (e) {
            setError('Failed to load feed scoring config. Check that the backend is running.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void loadConfigs(); }, [loadConfigs]);

    const showStatus = (type: 'success' | 'error', message: string) => {
        setStatus({ type, message });
        setTimeout(() => setStatus(null), 4000);
    };

    const handleSave = async (configKey: string) => {
        const raw = editValues[configKey];
        const value = parseFloat(raw);
        if (isNaN(value) || value <= 0) { showStatus('error', `Invalid value for "${configKey}".`); return; }
        if (configKey === 'interest.decay_rate' && value >= 1.0) { showStatus('error', 'Decay rate must be < 1.0'); return; }
        setSaving(prev => ({ ...prev, [configKey]: true }));
        try {
            await feedConfigApi.update({ configKey, configValue: value });
            showStatus('success', `"${CONFIG_META[configKey]?.label ?? configKey}" updated.`);
            await loadConfigs();
        } catch { showStatus('error', `Failed to update "${configKey}".`); }
        finally { setSaving(prev => ({ ...prev, [configKey]: false })); }
    };

    const getConfig = (key: string) => configs.find(c => c.configKey === key);

    const renderCard = (key: string) => {
        const config = getConfig(key);
        const meta = CONFIG_META[key];
        if (!meta) return null;
        
        const isDirty = config ? (editValues[key] !== undefined && parseFloat(editValues[key]) !== config.configValue) : false;
        
        return (
            <div key={key} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'border-color 0.2s', opacity: config ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F3F4F6', display: 'grid', placeItems: 'center', color: '#111827', flexShrink: 0 }}>{meta.icon}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{meta.label}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace' }}>{key}</div>
                    </div>
                    {isDirty && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: '#111827', color: '#fff' }}>unsaved</span>}
                </div>
                <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 16, lineHeight: 1.4 }}>{meta.hint}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input id={`config-${key}`} type="number" step={key === 'interest.decay_rate' ? '0.01' : '0.5'} min={0.01} max={key === 'interest.decay_rate' ? 0.99 : 100}
                        value={editValues[key] ?? config?.configValue ?? ''}
                        disabled={!config}
                        onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${isDirty ? '#111827' : '#D1D5DB'}`, fontSize: 14, fontWeight: 600, color: '#111827', outline: 'none', boxSizing: 'border-box', background: '#F9FAFB' }}
                    />
                    <button type="button" id={`save-${key}`} onClick={() => { void handleSave(key); }} disabled={saving[key] || !isDirty || !config}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: isDirty ? '1px solid #111827' : '1px solid transparent', background: isDirty ? '#111827' : '#F3F4F6', color: isDirty ? '#fff' : '#9CA3AF', cursor: isDirty ? 'pointer' : 'default', fontWeight: 600, fontSize: 13 }}>
                        <Save size={14} />{saving[key] ? 'Saving...' : 'Save'}
                    </button>
                </div>
                {config && config.updatedAt && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12, paddingTop: 10, borderTop: '1px dashed #E5E7EB' }}>Updated: {formatDate(config.updatedAt)}</div>}
            </div>
        );
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowHelp(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', cursor: 'pointer', fontWeight: 600, fontSize: 13, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <Info size={16} /> Hướng dẫn sử dụng
                </button>
            </div>

            {status && <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: status.type === 'success' ? '#F0FDF4' : '#FEF2F2', color: status.type === 'success' ? '#166534' : '#991B1B', border: `1px solid ${status.type === 'success' ? '#BBF7D0' : '#FECACA'}`, fontWeight: 600, fontSize: 13 }}>{status.message}</div>}

            {error && <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', fontWeight: 600, fontSize: 13 }}>{error}</div>}

            {loading && configs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>Đang tải cấu hình...</div>
            ) : (
                <>
                    <section style={{ marginBottom: 24, background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Trọng số điểm tương tác</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Số điểm cộng thêm vào hồ sơ sở thích của người dùng cho mỗi loại tương tác.</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                            {GROUP_SCORE.map(renderCard)}
                        </div>
                    </section>
                    
                    <section style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Thông số tạo Feed</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Các giới hạn và ngưỡng hệ thống để xây dựng Feed cá nhân hóa.</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                            {GROUP_FEED.map(renderCard)}
                        </div>
                    </section>
                </>
            )}

            {showHelp && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>Hướng dẫn cấu hình Feed & Tag</h2>
                            <button type="button" onClick={() => setShowHelp(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>&times;</button>
                        </div>
                        <div style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginTop: 0 }}>1. Trọng số tương tác (Scoring Weights)</h3>
                            <p style={{ margin: '8px 0' }}>Khi người dùng tương tác (xem, thích, lưu, chia sẻ) với bài viết, điểm sở thích của họ đối với các Tag của bài viết đó sẽ tăng lên. Điểm sở thích càng cao, hệ thống càng ưu tiên hiển thị bài viết thuộc Tag đó vào Feed của họ.</p>
                            
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginTop: 20 }}>2. Tỷ lệ giảm điểm (Decay Rate)</h3>
                            <p style={{ margin: '8px 0' }}>Để đảm bảo Feed phản ánh đúng sở thích hiện tại (không bị kẹt ở quá khứ), điểm sở thích sẽ giảm dần mỗi ngày. Ví dụ: hệ số <code>0.95</code> nghĩa là mỗi ngày điểm sẽ tự động giảm đi 5%.</p>

                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginTop: 20 }}>3. Giới hạn Tag (Top Tags Limit)</h3>
                            <p style={{ margin: '8px 0' }}>Số lượng Tag tối đa có điểm cao nhất của người dùng được dùng để truy vấn bài viết cho <strong>Feed Cá Nhân Hóa</strong> (Personalized Feed). Trị số này giúp tối ưu hiệu năng cơ sở dữ liệu.</p>

                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginTop: 20 }}>4. Ngưỡng chuyển đổi (Fallback Threshold)</h3>
                            <p style={{ margin: '8px 0' }}>Nếu <strong>Feed Cá Nhân Hóa</strong> trả về số lượng bài viết ít hơn ngưỡng này (thường xảy ra với user mới, chưa tương tác gì), hệ thống sẽ lấy thêm bài viết từ <strong>Trending Feed</strong> để đắp vào cho đủ.</p>

                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginTop: 20 }}>5. Số Like tối thiểu (Min Like Threshold)</h3>
                            <p style={{ margin: '8px 0' }}>Là một bộ lọc dành riêng cho luồng <strong>Trending Feed</strong>. Bất kỳ bài viết nào muốn xuất hiện trên Trending Feed (hiển thị chung cho mọi người) thì phải có tổng số Like lớn hơn hoặc bằng ngưỡng này.</p>
                        </div>
                        <div style={{ marginTop: 28, textAlign: 'right' }}>
                            <button type="button" onClick={() => setShowHelp(false)} style={{ padding: '10px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Đã hiểu</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; } input[type=number] { -moz-appearance: textfield; }`}</style>
        </div>
    );
}

