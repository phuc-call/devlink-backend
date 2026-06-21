import { useEffect, useState } from 'react';
import { Award, Sparkles, ShieldCheck, RefreshCw, Upload, BarChart2, Users } from 'lucide-react';
import { badgeApi } from '../../../api/user-service/badgeApi';
import type {
    BadgeConfigResponse,
    BadgeVideoLimitResponse,
    BadgeStatsResponse,
    UserSummaryResponse,
    CreateBadgeConfigRequest,
    UpdateBadgeVideoLimitRequest,
    GrantRedTickBatchRequest,
    BadgeType,
} from '../../../types/badge.types';
import { BADGE_LABELS, BADGE_COLORS } from '../../../types/badge.types';
import UserSearchSelect from '../components/UserSearchSelect';
import BadgeStatsPanel from '../components/Badgestatspanel.tsx';
import UserBadgeDetailModal from '../components/Userbadgedetailmodal.tsx';

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

export default function AdminBadgePage() {
    const [configs, setConfigs] = useState<BadgeConfigResponse[]>([]);
    const [activeConfig, setActiveConfig] = useState<BadgeConfigResponse | null>(null);
    const [videoLimits, setVideoLimits] = useState<BadgeVideoLimitResponse[]>([]);
    const [stats, setStats] = useState<BadgeStatsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [form, setForm] = useState<CreateBadgeConfigRequest>({
        popularThreshold: 1,
        bleuTickThreshold: 2,
        minCompletionPercent: 50,
        blueTickPendingRatio: 50,
        gracePeriodDays: 7,
    });
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
    const [savingConfig, setSavingConfig] = useState(false);
    const [videoLoading, setVideoLoading] = useState<Record<string, boolean>>({});

    // Grant Red Tick — dùng UserSearchSelect thay vì nhập userId thô
    const [grantSingleUser, setGrantSingleUser] = useState<UserSummaryResponse | null>(null);
    const [grantSingleReason, setGrantSingleReason] = useState('');
    const [grantBatch, setGrantBatch] = useState({ userIds: '', reason: '' });
    const [grantLoading, setGrantLoading] = useState(false);

    // Evaluate — dùng UserSearchSelect
    const [evaluateUser, setEvaluateUser] = useState<UserSummaryResponse | null>(null);
    const [evaluateLoading, setEvaluateLoading] = useState(false);

    // Badge detail modal
    const [detailUserId, setDetailUserId] = useState<number | null>(null);

    // Danh sách user theo badge type
    const [filterBadge, setFilterBadge] = useState<BadgeType | null>(null);
    const [filteredUsers, setFilteredUsers] = useState<UserSummaryResponse[]>([]);
    const [filterLoading, setFilterLoading] = useState(false);
    const [filterPage, setFilterPage] = useState(0);
    const [filterTotalPages, setFilterTotalPages] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!filterBadge) return;
        loadFilteredUsers(filterBadge, 0);
    }, [filterBadge]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [configsRes, activeRes, limitsRes, statsRes] = await Promise.all([
                badgeApi.getAllBadgeConfigs(),
                badgeApi.getActiveBadgeConfig(),
                badgeApi.getAllBadgeVideoLimits(),
                badgeApi.getBadgeStats(),
            ]);
            setConfigs(configsRes.data.data);
            setActiveConfig(activeRes.data.data);
            setVideoLimits(limitsRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error(error);
            showStatus('error', 'Không tải được dữ liệu badge. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const loadFilteredUsers = async (badge: BadgeType, page: number) => {
        setFilterLoading(true);
        try {
            const res = await badgeApi.getUsersByBadgeType(badge, page);
            setFilteredUsers(res.data.data.content);
            setFilterPage(res.data.data.number);
            setFilterTotalPages(res.data.data.totalPages);
        } catch (error) {
            console.error(error);
            showStatus('error', 'Không tải được danh sách user.');
        } finally {
            setFilterLoading(false);
        }
    };

    const showStatus = (type: 'success' | 'error', message: string) => {
        setStatus({ type, message });
        window.setTimeout(() => setStatus(null), 4000);
    };

    const handleConfigSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSavingConfig(true);
        try {
            if (selectedConfigId) {
                await badgeApi.updateBadgeConfig(selectedConfigId, form);
                showStatus('success', 'Cập nhật badge config thành công.');
            } else {
                await badgeApi.createBadgeConfig(form);
                showStatus('success', 'Tạo badge config mới thành công.');
            }
            await loadData();
            resetConfigForm();
        } catch (error) {
            console.error(error);
            showStatus('error', 'Có lỗi khi lưu badge config.');
        } finally {
            setSavingConfig(false);
        }
    };

    const resetConfigForm = () => {
        setSelectedConfigId(null);
        setForm({ popularThreshold: 1, bleuTickThreshold: 2, minCompletionPercent: 50, blueTickPendingRatio: 50, gracePeriodDays: 7 });
    };

    const handleSelectConfig = (config: BadgeConfigResponse) => {
        setSelectedConfigId(config.id);
        setForm({
            popularThreshold: config.popularThreshold,
            bleuTickThreshold: config.bleuTickThreshold,
            minCompletionPercent: config.minCompletionPercent,
            blueTickPendingRatio: config.blueTickPendingRatio,
            gracePeriodDays: config.gracePeriodDays,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleVideoLimitChange = (badgeType: string, field: 'maxSeconds' | 'maxCount', value: number) => {
        setVideoLimits(prev => prev.map(item => item.badgeType === badgeType ? { ...item, [field]: value } : item));
    };

    const handleUpdateVideoLimit = async (limit: BadgeVideoLimitResponse) => {
        setVideoLoading(prev => ({ ...prev, [limit.badgeType]: true }));
        try {
            const body: UpdateBadgeVideoLimitRequest = { maxSeconds: limit.maxSeconds, maxCount: limit.maxCount };
            await badgeApi.updateBadgeVideoLimit(limit.badgeType, body);
            showStatus('success', `Cập nhật video limit cho ${BADGE_LABELS[limit.badgeType as BadgeType]} thành công.`);
            await loadData();
        } catch (error) {
            console.error(error);
            showStatus('error', `Cập nhật video limit cho ${limit.badgeType} thất bại.`);
        } finally {
            setVideoLoading(prev => ({ ...prev, [limit.badgeType]: false }));
        }
    };

    const handleGrantSingle = async () => {
        if (!grantSingleUser) {
            showStatus('error', 'Vui lòng chọn user.');
            return;
        }
        setGrantLoading(true);
        try {
            await badgeApi.grantRedTick(grantSingleUser.id, grantSingleReason.trim() || undefined);
            showStatus('success', `Cấp Red Tick cho ${grantSingleUser.username} thành công.`);
            setGrantSingleUser(null);
            setGrantSingleReason('');
        } catch (error) {
            console.error(error);
            showStatus('error', 'Cấp Red Tick thất bại.');
        } finally {
            setGrantLoading(false);
        }
    };

    const handleGrantBatch = async () => {
        const ids = grantBatch.userIds.split(/[,\s]+/).map(v => Number(v.trim())).filter(id => id > 0);
        if (ids.length === 0) {
            showStatus('error', 'Vui lòng nhập danh sách userId hợp lệ.');
            return;
        }
        setGrantLoading(true);
        try {
            const body: GrantRedTickBatchRequest = { userIds: ids, reason: grantBatch.reason.trim() || undefined };
            await badgeApi.grantRedTickBatch(body);
            showStatus('success', `Cấp Red Tick hàng loạt cho ${ids.length} user thành công.`);
            setGrantBatch({ userIds: '', reason: '' });
        } catch (error) {
            console.error(error);
            showStatus('error', 'Cấp Red Tick hàng loạt thất bại.');
        } finally {
            setGrantLoading(false);
        }
    };

    const handleEvaluateUser = async () => {
        if (!evaluateUser) {
            showStatus('error', 'Vui lòng chọn user để đánh giá.');
            return;
        }
        setEvaluateLoading(true);
        try {
            await badgeApi.evaluateUser(evaluateUser.id);
            showStatus('success', `Đã gửi yêu cầu đánh giá badge cho ${evaluateUser.username}.`);
            setEvaluateUser(null);
        } catch (error) {
            console.error(error);
            showStatus('error', 'Đánh giá user thất bại.');
        } finally {
            setEvaluateLoading(false);
        }
    };

    const handleFilterByBadge = (badge: BadgeType) => {
        setFilterBadge(badge);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Quản lý Badge</h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                        Quản lý cấu hình badge, giới hạn video, cấp Red Tick và đánh giá badge user.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadData}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 16px', borderRadius: 10,
                        background: '#F3F4F6', color: '#111827', border: '1px solid #E5E7EB',
                        cursor: 'pointer', fontWeight: 600,
                    }}
                >
                    <RefreshCw size={16} />
                    Làm mới
                </button>
            </div>

            {status && (
                <div style={{
                    marginBottom: 24, padding: '14px 18px', borderRadius: 12,
                    background: status.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    color: status.type === 'success' ? '#166534' : '#B91C1C',
                    border: `1px solid ${status.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                }}>
                    {status.message}
                </div>
            )}

            {/* Stats */}
            <section style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 16px 40px rgba(15,23,42,0.04)', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, background: '#F0FDF4', display: 'grid', placeItems: 'center' }}>
                        <BarChart2 size={20} color="#15803D" />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Thống kê badge</div>
                        <div style={{ fontSize: 13, color: '#6B7280' }}>Click vào badge để xem danh sách user.</div>
                    </div>
                </div>
                <BadgeStatsPanel stats={stats} onFilterByBadge={handleFilterByBadge} />
            </section>

            {/* Config + Video Limits */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
                <section style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 16px 40px rgba(15,23,42,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 14, background: '#EFF6FF', display: 'grid', placeItems: 'center' }}>
                            <Award size={20} color="#1D4ED8" />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Cấu hình Badge</div>
                            <div style={{ fontSize: 13, color: '#6B7280' }}>Xem và chỉnh sửa các ngưỡng badge.</div>
                        </div>
                    </div>

                    {activeConfig ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
                            <div style={{ padding: 16, borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active</div>
                                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: '#111827' }}>#{activeConfig.id}</div>
                                <div style={{ marginTop: 8, fontSize: 13, color: '#4B5563' }}>Cập nhật: {formatDate(activeConfig.updatedAt)}</div>
                            </div>
                            <div style={{ padding: 16, borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bởi admin</div>
                                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: '#111827' }}>{activeConfig.updatedBy}</div>
                                <div style={{ marginTop: 8, fontSize: 13, color: '#4B5563' }}>Active: {activeConfig.isActive ? 'Có' : 'Không'}</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginBottom: 24, color: '#6B7280' }}>Không có cấu hình badge active.</div>
                    )}

                    <div style={{ overflowX: 'auto', marginBottom: 24 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                            <thead>
                            <tr style={{ color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>ID</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Popular</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Blue Tick</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Min %</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Pending ratio</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Grace days</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Hành động</th>
                            </tr>
                            </thead>
                            <tbody>
                            {configs.map(config => (
                                <tr key={config.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                                    <td style={{ padding: '14px 16px' }}>{config.id}</td>
                                    <td style={{ padding: '14px 16px' }}>{config.popularThreshold}</td>
                                    <td style={{ padding: '14px 16px' }}>{config.bleuTickThreshold}</td>
                                    <td style={{ padding: '14px 16px' }}>{config.minCompletionPercent}%</td>
                                    <td style={{ padding: '14px 16px' }}>{config.blueTickPendingRatio}%</td>
                                    <td style={{ padding: '14px 16px' }}>{config.gracePeriodDays} ngày</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectConfig(config)}
                                            style={{ border: 'none', borderRadius: 10, background: '#EFF6FF', color: '#1D4ED8', padding: '8px 12px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            Chỉnh sửa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <form onSubmit={handleConfigSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {[
                            { label: 'Popular Threshold', key: 'popularThreshold', min: 1, max: undefined },
                            { label: 'Blue Tick Threshold', key: 'bleuTickThreshold', min: 1, max: undefined },
                            { label: 'Min Completion %', key: 'minCompletionPercent', min: 0, max: 100 },
                            { label: 'Blue Tick Pending Ratio', key: 'blueTickPendingRatio', min: 0, max: 100 },
                            { label: 'Grace Period Days', key: 'gracePeriodDays', min: 1, max: undefined },
                        ].map(({ label, key, min, max }) => (
                            <div key={key}>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#374151' }}>{label}</label>
                                <input
                                    type="number"
                                    min={min}
                                    max={max}
                                    value={form[key as keyof CreateBadgeConfigRequest]}
                                    onChange={e => setForm(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', boxSizing: 'border-box' }}
                                />
                            </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                            <button type="submit" disabled={savingConfig} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none', background: '#3B82F6', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                                {selectedConfigId ? 'Cập nhật config' : 'Tạo config mới'}
                            </button>
                            <button type="button" onClick={resetConfigForm} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                                Reset
                            </button>
                        </div>
                    </form>
                </section>

                <section style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 16px 40px rgba(15,23,42,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 14, background: '#FEF3C7', display: 'grid', placeItems: 'center' }}>
                            <Sparkles size={20} color="#B45309" />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Giới hạn video</div>
                            <div style={{ fontSize: 13, color: '#6B7280' }}>Cập nhật số video / thời lượng theo badge.</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gap: 14 }}>
                        {videoLimits.map(limit => (
                            <div key={limit.badgeType} style={{ padding: 16, borderRadius: 18, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#111827' }}>{BADGE_LABELS[limit.badgeType as BadgeType]}</div>
                                        <div style={{ fontSize: 13, color: '#6B7280' }}>Cập nhật lúc {formatDate(limit.updatedAt)}</div>
                                    </div>
                                    <button type="button" onClick={() => handleUpdateVideoLimit(limit)} disabled={videoLoading[limit.badgeType]} style={{ border: 'none', borderRadius: 10, background: '#3B82F6', color: '#fff', padding: '10px 14px', cursor: 'pointer', fontWeight: 700 }}>
                                        {videoLoading[limit.badgeType] ? 'Đang lưu...' : 'Lưu'}
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <label style={{ display: 'grid', gap: 6, fontSize: 13, color: '#374151' }}>
                                        Max seconds
                                        <input type="number" min={0} value={limit.maxSeconds} onChange={e => handleVideoLimitChange(limit.badgeType, 'maxSeconds', Number(e.target.value))} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
                                    </label>
                                    <label style={{ display: 'grid', gap: 6, fontSize: 13, color: '#374151' }}>
                                        Max count
                                        <input type="number" min={0} value={limit.maxCount} onChange={e => handleVideoLimitChange(limit.badgeType, 'maxCount', Number(e.target.value))} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Grant Red Tick + Evaluate */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <section style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 16px 40px rgba(15,23,42,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 14, background: '#ECFCCB', display: 'grid', placeItems: 'center' }}>
                            <ShieldCheck size={20} color="#15803D" />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Cấp Red Tick</div>
                            <div style={{ fontSize: 13, color: '#6B7280' }}>Cấp Red Tick đơn hoặc hàng loạt cho user.</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: 18 }}>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Cấp đơn</div>
                            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: '#374151' }}>
                                Chọn user
                                <UserSearchSelect value={grantSingleUser} onChange={setGrantSingleUser} />
                            </label>
                            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: '#374151' }}>
                                Lý do (tuỳ chọn)
                                <input type="text" value={grantSingleReason} onChange={e => setGrantSingleReason(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', boxSizing: 'border-box' }} />
                            </label>
                            <button type="button" onClick={handleGrantSingle} disabled={grantLoading || !grantSingleUser} style={{ width: 'fit-content', padding: '12px 16px', borderRadius: 12, border: 'none', background: '#16A34A', color: '#fff', cursor: 'pointer', fontWeight: 700, opacity: grantSingleUser ? 1 : 0.5 }}>
                                {grantLoading ? 'Đang gửi...' : 'Cấp Red Tick'}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Cấp hàng loạt</div>
                            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: '#374151' }}>
                                Danh sách User ID
                                <textarea rows={4} value={grantBatch.userIds} onChange={e => setGrantBatch(prev => ({ ...prev, userIds: e.target.value }))} placeholder="Ví dụ: 12, 34, 56" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', resize: 'vertical', boxSizing: 'border-box' }} />
                            </label>
                            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: '#374151' }}>
                                Lý do (tuỳ chọn)
                                <input type="text" value={grantBatch.reason} onChange={e => setGrantBatch(prev => ({ ...prev, reason: e.target.value }))} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', boxSizing: 'border-box' }} />
                            </label>
                            <button type="button" onClick={handleGrantBatch} disabled={grantLoading} style={{ width: 'fit-content', padding: '12px 16px', borderRadius: 12, border: 'none', background: '#1D4ED8', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                                {grantLoading ? 'Đang gửi...' : 'Cấp batch Red Tick'}
                            </button>
                        </div>
                    </div>
                </section>

                <section style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 16px 40px rgba(15,23,42,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 14, background: '#EFF6FF', display: 'grid', placeItems: 'center' }}>
                            <Upload size={20} color="#2563EB" />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Đánh giá người dùng</div>
                            <div style={{ fontSize: 13, color: '#6B7280' }}>Kích hoạt lại quy trình đánh giá badge cho user.</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gap: 14 }}>
                        <label style={{ display: 'grid', gap: 6, fontSize: 13, color: '#374151' }}>
                            Chọn user
                            <UserSearchSelect value={evaluateUser} onChange={setEvaluateUser} />
                        </label>
                        <button type="button" onClick={handleEvaluateUser} disabled={evaluateLoading || !evaluateUser} style={{ width: 'fit-content', padding: '12px 16px', borderRadius: 12, border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer', fontWeight: 700, opacity: evaluateUser ? 1 : 0.5 }}>
                            {evaluateLoading ? 'Đang gửi...' : 'Đánh giá lại'}
                        </button>
                    </div>
                </section>
            </div>

            {/* Danh sách user theo badge */}
            {filterBadge && (
                <section style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 16px 40px rgba(15,23,42,0.04)', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 14, background: BADGE_COLORS[filterBadge].bg, display: 'grid', placeItems: 'center' }}>
                                <Users size={20} color={BADGE_COLORS[filterBadge].color} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                                    User — {BADGE_LABELS[filterBadge]}
                                </div>
                                <div style={{ fontSize: 13, color: '#6B7280' }}>Trang {filterPage + 1} / {filterTotalPages}</div>
                            </div>
                        </div>
                        <button type="button" onClick={() => setFilterBadge(null)} style={{ border: 'none', background: '#F3F4F6', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#374151', fontWeight: 600 }}>
                            Đóng
                        </button>
                    </div>

                    {filterLoading ? (
                        <div style={{ color: '#6B7280', padding: 16 }}>Đang tải...</div>
                    ) : (
                        <>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>User</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Badge</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Hành động</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: '#374151' }}>
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span style={{ fontWeight: 600, color: '#111827' }}>{user.username}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: 13 }}>{user.email}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                                <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: BADGE_COLORS[user.badge].bg, color: BADGE_COLORS[user.badge].color, border: `1px solid ${BADGE_COLORS[user.badge].border}` }}>
                                                    {BADGE_LABELS[user.badge]}
                                                </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{user.status}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button type="button" onClick={() => setDetailUserId(user.id)} style={{ border: 'none', borderRadius: 10, background: '#EFF6FF', color: '#1D4ED8', padding: '7px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                                                Xem lịch sử
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {filterTotalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                                    <button type="button" onClick={() => loadFilteredUsers(filterBadge, filterPage - 1)} disabled={filterPage === 0} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600, opacity: filterPage === 0 ? 0.4 : 1 }}>
                                        ← Trước
                                    </button>
                                    <span style={{ padding: '8px 14px', fontSize: 13, color: '#6B7280' }}>{filterPage + 1} / {filterTotalPages}</span>
                                    <button type="button" onClick={() => loadFilteredUsers(filterBadge, filterPage + 1)} disabled={filterPage >= filterTotalPages - 1} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600, opacity: filterPage >= filterTotalPages - 1 ? 0.4 : 1 }}>
                                        Sau →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}

            {loading && (
                <div style={{ padding: 24, borderRadius: 20, background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#6B7280' }}>
                    Đang tải dữ liệu...
                </div>
            )}

            <UserBadgeDetailModal userId={detailUserId} onClose={() => setDetailUserId(null)} />
        </div>
    );
}