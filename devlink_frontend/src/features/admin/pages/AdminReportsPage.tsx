// src/features/admin/pages/AdminReportsPage.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Flag,
    ShieldAlert,
    CheckCircle,
    XCircle,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Clock,
    RefreshCw,
    Ban,
    BarChart2,
    Settings,
    History,
    FileText,
    Edit2,
    Save,
    ToggleLeft,
    ToggleRight,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { reportApi } from '../../../api/post-service/reportApi';
import { violationApi } from '../../../api/post-service/violationApi';
import type {
    ReportItemResponse,
    ReportPageResponse,
    ReportTargetType,
    ReportStatus,
    ReportAdminDetailResponse,
} from '../../../types/report.types';
import {
    REPORT_REASON_LABELS,
    REPORT_STATUS_LABELS,
    TARGET_TYPE_LABELS,
} from '../../../types/report.types';
import type {
    ViolationOverviewResponse,
    ViolationHistoryResponse,
    PenaltyConfigResponse,
    ViolationPageResponse,
    PenalizedUserResponse,
    ViolationTypeStatsResponse,
    TopViolatorResponse
} from '../../../types/violation.types';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';


// ── Helpers ────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return '';
    // Fix timezone: ensure the date string is treated as UTC if it doesn't have timezone info
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
    const diff = Date.now() - new Date(utcDateStr).getTime();
    
    // Check if diff is negative (future time due to clock sync issues)
    if (diff < 0) return 'Vừa xong';

    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} ngày trước`;
    if (h > 0) return `${h} giờ trước`;
    if (m > 0) return `${m} phút trước`;
    return 'Vừa xong';
}

// ── Status badge ───────────────────────────────────────────────────────

function StatusBadge({ status }: { readonly status: ReportStatus }) {
    const map: Record<ReportStatus, { bg: string; color: string; icon: React.ReactNode }> = {
        PENDING:  { bg: '#FFFBEB', color: '#F59E0B', icon: <Clock size={11} /> },
        RESOLVED: { bg: '#F0FDF4', color: '#16A34A', icon: <CheckCircle size={11} /> },
        REJECTED: { bg: '#F3F4F6', color: '#6B7280', icon: <XCircle size={11} /> },
    };
    const s = map[status];
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 9999,
            background: s.bg,
            color: s.color,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
        }}>
            {s.icon}
            {REPORT_STATUS_LABELS[status]}
        </span>
    );
}

// ── Target type badge ──────────────────────────────────────────────────

function TargetBadge({ type }: { readonly type: ReportTargetType }) {
    const map: Record<string, { bg: string; color: string }> = {
        POST:          { bg: '#EFF6FF', color: '#2563EB' },
        COMMENT:       { bg: '#F5F3FF', color: '#7C3AED' },
        COMMENT_REPLY: { bg: '#FFF7ED', color: '#C2410C' },
    };
    const s = map[type] ?? { bg: '#F3F4F6', color: '#6B7280' };
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: 9999,
            background: s.bg,
            color: s.color,
            fontSize: 11,
            fontWeight: 600,
        }}>
            {TARGET_TYPE_LABELS[type] ?? type}
        </span>
    );
}

// ── Review modal ───────────────────────────────────────────────────────

interface ReviewModalProps {
    readonly report: ReportItemResponse;
    readonly onClose: () => void;
    readonly onDone: () => void;
}

function ReviewModal({ report, onClose, onDone }: ReviewModalProps) {
    const [approved, setApproved] = useState<boolean | null>(null);
    const [permanent, setPermanent] = useState(false);
    const [reviewNote, setReviewNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (approved === null) { setError('Vui lòng chọn hành động'); return; }
        setLoading(true);
        setError('');
        try {
            await reportApi.reviewReport(report.reportId, {
                approved,
                permanent: approved ? permanent : false,
                reviewNote: reviewNote.trim() || undefined,
            });
            onDone();
        } catch {
            setError('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(17,24,39,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 12,
                width: '100%',
                maxWidth: 520,
                boxShadow: '0 20px 25px rgba(0,0,0,0.12)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}>
                    <ShieldAlert size={20} color="#3B82F6" />
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
                        Xử lý báo cáo #{report.reportId}
                    </span>
                </div>

                {/* Content */}
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Info */}
                    <div style={{
                        background: '#F9FAFB',
                        borderRadius: 8,
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        fontSize: 13,
                        color: '#374151',
                    }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <span style={{ color: '#6B7280', minWidth: 110 }}>Loại nội dung:</span>
                            <TargetBadge type={report.targetType} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <span style={{ color: '#6B7280', minWidth: 110 }}>Lý do:</span>
                            <span style={{ fontWeight: 500 }}>{REPORT_REASON_LABELS[report.reason] ?? report.reason}</span>
                        </div>
                        {report.violatorName && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ color: '#6B7280', minWidth: 110 }}>Người vi phạm:</span>
                                <span style={{ fontWeight: 500 }}>{report.violatorName}</span>
                            </div>
                        )}
                        {report.description && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ color: '#6B7280', minWidth: 110 }}>Mô tả:</span>
                                <span style={{ color: '#374151' }}>{report.description}</span>
                            </div>
                        )}
                    </div>

                    {/* Chọn hành động */}
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                            Hành động
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                type="button"
                                onClick={() => setApproved(true)}
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    border: `2px solid ${approved === true ? '#EF4444' : '#E5E7EB'}`,
                                    background: approved === true ? '#FEF2F2' : '#fff',
                                    color: approved === true ? '#DC2626' : '#374151',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.15s',
                                }}
                            >
                                <Ban size={15} />
                                Duyệt & Xử phạt
                            </button>
                            <button
                                type="button"
                                onClick={() => setApproved(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    border: `2px solid ${approved === false ? '#22C55E' : '#E5E7EB'}`,
                                    background: approved === false ? '#F0FDF4' : '#fff',
                                    color: approved === false ? '#16A34A' : '#374151',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.15s',
                                }}
                            >
                                <XCircle size={15} />
                                Không vi phạm
                            </button>
                        </div>
                    </div>

                    {/* Permanent — chỉ hiện khi approved */}
                    {approved === true && (
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            borderRadius: 8,
                            background: '#FFF7ED',
                            border: '1px solid #FED7AA',
                            cursor: 'pointer',
                            fontSize: 13,
                            color: '#92400E',
                            fontWeight: 500,
                        }}>
                            <input
                                type="checkbox"
                                checked={permanent}
                                onChange={e => setPermanent(e.target.checked)}
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                            />
                            <AlertTriangle size={14} />
                            Cấm vĩnh viễn (Ghi đè hình phạt tự động)
                        </label>
                    )}

                    {/* Ghi chú */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                            Ghi chú xử lý <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(tùy chọn)</span>
                        </label>
                        <textarea
                            value={reviewNote}
                            onChange={e => setReviewNote(e.target.value)}
                            rows={3}
                            placeholder="Nhập lý do hoặc ghi chú cho quyết định này..."
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid #D1D5DB',
                                fontSize: 13,
                                color: '#374151',
                                background: '#F9FAFB',
                                resize: 'vertical',
                                fontFamily: "'Inter', sans-serif",
                                boxSizing: 'border-box',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {error && (
                        <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 8,
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: '1px solid #D1D5DB',
                            background: '#fff',
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#374151',
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={() => { void handleSubmit(); }}
                        disabled={loading || approved === null}
                        style={{
                            padding: '8px 20px',
                            borderRadius: 8,
                            border: 'none',
                            background: approved === null || loading ? '#9CA3AF' : '#3B82F6',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: loading || approved === null ? 'not-allowed' : 'pointer',
                            transition: 'background 0.15s',
                        }}
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    );

    
}

// ── Confirm delete modal ───────────────────────────────────────────────

interface ConfirmDeleteProps {
    readonly reportId: number;
    readonly onClose: () => void;
    readonly onDone: () => void;
}

function ConfirmDeleteModal({ reportId, onClose, onDone }: ConfirmDeleteProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            await reportApi.deleteReport(reportId);
            onDone();
        } catch {
            setError('Không thể xóa báo cáo này');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(17,24,39,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 12,
                width: '100%',
                maxWidth: 400,
                boxShadow: '0 20px 25px rgba(0,0,0,0.12)',
                padding: '24px 20px',
                textAlign: 'center',
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: '#FEF2F2', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                }}>
                    <Trash2 size={22} color="#EF4444" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
                    Xóa báo cáo #{reportId}?
                </h3>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>
                    Hành động này không thể hoàn tác. Chỉ báo cáo đã RESOLVED hoặc REJECTED mới xóa được.
                </p>
                {error && (
                    <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{error}</p>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: '8px 20px',
                            borderRadius: 8,
                            border: '1px solid #D1D5DB',
                            background: '#fff',
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#374151',
                            cursor: 'pointer',
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={() => { void handleDelete(); }}
                        disabled={loading}
                        style={{
                            padding: '8px 20px',
                            borderRadius: 8,
                            border: 'none',
                            background: loading ? '#9CA3AF' : '#DC2626',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? 'Đang xóa...' : 'Xóa'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Filter bar ─────────────────────────────────────────────────────────

const TARGET_FILTER_OPTIONS: { label: string; value: ReportTargetType }[] = [
    { label: 'Bài viết',    value: 'POST' },
    { label: 'Bình luận',   value: 'COMMENT' },
    { label: 'Trả lời BL',  value: 'COMMENT_REPLY' },
];

const STATUS_FILTER_OPTIONS: { label: string; value: ReportStatus | '' }[] = [
    { label: 'Tất cả',      value: '' },
    { label: 'Chờ xử lý',   value: 'PENDING' },
    { label: 'Đã xử lý',    value: 'RESOLVED' },
    { label: 'Đã từ chối',  value: 'REJECTED' },
];

// ── Skeleton row ───────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr>
            {[1,2,3,4,5,6].map(i => (
                <td key={i} style={{ padding: '14px 16px' }}>
                    <div style={{
                        height: 14,
                        background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
                        backgroundSize: '200% 100%',
                        borderRadius: 4,
                        animation: 'shimmer 1.4s infinite',
                        width: i === 2 ? '80%' : i === 3 ? '60%' : '70%',
                    }} />
                </td>
            ))}
        </tr>
    );
}

// ── Overview section ───────────────────────────────────────────────────

function OverviewSection() {
    const navigate = useNavigate();
    const [data, setData] = useState<ViolationOverviewResponse | null>(null);
    const [detailedData, setDetailedData] = useState<ViolationTypeStatsResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredUser, setHoveredUser] = useState<TopViolatorResponse | null>(null);

    const fetchOverview = useCallback(async () => {
        try {
            const [overviewRes, detailedRes] = await Promise.all([
                violationApi.getOverview(),
                violationApi.getDetailedOverview()
            ]);
            setData(overviewRes.data.data);
            setDetailedData(detailedRes.data.data);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchOverview().finally(() => setLoading(false));
    }, [fetchOverview]);

    useWebSocket('post', '/topic/admin', (event) => {
        if (event.eventType === 'REPORT_REVIEWED' || event.eventType === 'PENALTY_CONFIG_UPDATED' || event.eventType === 'VIOLATION_ADDED') {
            void fetchOverview();
        }
    });

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
                Đang tải dữ liệu tổng quan...
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>
                Lỗi khi tải dữ liệu tổng quan.
            </div>
        );
    }

    const reportStatusData = [
        { name: 'Chờ xử lý', value: data.pendingReports, color: '#F59E0B' },
        { name: 'Đã xử lý', value: data.resolvedReports, color: '#22C55E' },
        { name: 'Đã từ chối', value: data.rejectedReports, color: '#6B7280' },
    ];

    const violationData = [
        { name: 'Tổng vi phạm', value: data.totalViolations, fill: '#EF4444' },
        { name: 'Đang bị phạt', value: data.activeViolations, fill: '#8B5CF6' },
    ];

    const typeColor: Record<string,{bg:string,color:string}> = {
        POST:          {bg:'#EFF6FF',color:'#2563EB'},
        COMMENT:       {bg:'#F5F3FF',color:'#7C3AED'},
        COMMENT_REPLY: {bg:'#FFF7ED',color:'#C2410C'},
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Reports Chart */}
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Trạng thái Báo cáo</h3>
                    <div style={{ height: 260, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={reportStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {reportStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} báo cáo`, 'Số lượng']} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Violations Chart */}
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Thống kê Vi phạm</h3>
                    <div style={{ height: 260, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={violationData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip cursor={{ fill: '#F9FAFB' }} formatter={(value) => [value, 'Số lượng']} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                    {violationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Stats Charts */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#111827' }}>Chi tiết theo Loại Nội Dung</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                    {/* Bar Chart: Tổng Vi Phạm & Số Người */}
                    <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16, textAlign: 'center' }}>
                            Thống Kê Số Lượng
                        </h4>
                        <div style={{ height: 320, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={detailedData.map(stat => ({
                                    name: TARGET_TYPE_LABELS[stat.targetType] || stat.targetType,
                                    'Tổng vi phạm': stat.totalViolations,
                                    'Số người': stat.uniqueViolators
                                }))} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <Tooltip cursor={{ fill: '#F9FAFB' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="Tổng vi phạm" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Số người" fill="#10B981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Scatter Chart: Phân bố Top người vi phạm */}
                    <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16, textAlign: 'center' }}>
                            Phân Bố Người Vi Phạm (Top 100)
                        </h4>
                        <div style={{ height: 320, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis 
                                        type="number" 
                                        dataKey="typeNum" 
                                        name="Loại" 
                                        domain={[0, 4]} 
                                        ticks={[1, 2, 3]} 
                                        tickFormatter={(val) => {
                                            if (val === 1) return TARGET_TYPE_LABELS['POST'] || 'Bài viết';
                                            if (val === 2) return TARGET_TYPE_LABELS['COMMENT'] || 'Bình luận';
                                            if (val === 3) return TARGET_TYPE_LABELS['COMMENT_REPLY'] || 'Trả lời';
                                            return '';
                                        }} 
                                        axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} 
                                    />
                                    <YAxis type="number" dataKey="count" name="Số lần vi phạm" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <ZAxis type="number" dataKey="z" range={[100, 300]} />
                                    <Tooltip 
                                        cursor={{ strokeDasharray: '3 3' }} 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div style={{ background: '#111827', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.name}</div>
                                                        <div style={{ color: '#9CA3AF' }}>Loại: <span style={{ color: '#fff', fontWeight: 600 }}>{data.typeLabel}</span></div>
                                                        <div style={{ color: '#9CA3AF' }}>Vi phạm: <span style={{ color: '#F87171', fontWeight: 600 }}>{data.count}</span> lần</div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter 
                                        data={detailedData.flatMap(stat => {
                                            let baseNum = 1;
                                            if (stat.targetType === 'COMMENT') baseNum = 2;
                                            if (stat.targetType === 'COMMENT_REPLY') baseNum = 3;
                                            
                                            return stat.topViolators.map(user => ({
                                                typeNum: baseNum + (Math.random() - 0.5) * 0.5, // Jitter for swarm effect
                                                typeLabel: TARGET_TYPE_LABELS[stat.targetType] || stat.targetType,
                                                count: user.violationCount,
                                                z: user.violationCount,
                                                name: user.userName,
                                                avatar: user.avatarUrl,
                                                targetType: stat.targetType,
                                                id: user.userId
                                            }));
                                        })}
                                        shape={(props: any) => {
                                            const { cx, cy, payload } = props;
                                            if (cx == null || cy == null) return null;
                                            const style = typeColor[payload.targetType] || { bg: '#E5E7EB', color: '#6B7280' };
                                            const clipId = `clip-${payload.id}-${Math.random()}`;
                                            return (
                                                <g style={{ cursor: 'pointer' }} onClick={() => navigate('/profile/' + payload.id)}>
                                                    <defs>
                                                        <clipPath id={clipId}>
                                                            <circle cx={cx} cy={cy} r={12} />
                                                        </clipPath>
                                                    </defs>
                                                    <circle cx={cx} cy={cy} r={14} fill="#fff" stroke={style.color} strokeWidth={1} style={{ opacity: 0.8 }} />
                                                    {payload.avatar ? (
                                                        <image href={payload.avatar} x={cx - 12} y={cy - 12} height="24" width="24" clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />
                                                    ) : (
                                                        <g>
                                                            <circle cx={cx} cy={cy} r={12} fill={style.bg} />
                                                            <text x={cx} y={cy + 4} textAnchor="middle" fill={style.color} fontSize="10" fontWeight="bold">
                                                                {payload.name.charAt(0).toUpperCase()}
                                                            </text>
                                                        </g>
                                                    )}
                                                </g>
                                            );
                                        }}
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Violation History Tab ───────────────────────────────────────────────

function ViolationHistoryTab() {
    const [data, setData] = useState<ViolationPageResponse | null>(null);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filterUser, setFilterUser] = useState('');

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const uid = filterUser.trim() !== '' ? Number(filterUser) : undefined;
            const res = await violationApi.getHistories(uid, page, 15);
            setData(res.data.data);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [page, filterUser]);

    useEffect(() => { void fetch(); }, [fetch]);

    const thS: React.CSSProperties = { padding:'10px 14px', fontSize:11, fontWeight:600, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:'1px solid #E5E7EB', textAlign:'left', whiteSpace:'nowrap' };

    const formatDate = (s: string | null) => {
        if (!s) return '∞ (Vĩnh viễn)';
        const utcDateStr = s.endsWith('Z') ? s : `${s}Z`;
        return new Date(utcDateStr).toLocaleDateString('vi-VN');
    };

    return (
        <div>
            <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
                <input
                    value={filterUser} onChange={e=>{setFilterUser(e.target.value);setPage(0);}}
                    placeholder="Lọc theo User ID người vi phạm..."
                    style={{padding:'7px 12px',borderRadius:8,border:'1px solid #D1D5DB',fontSize:13,width:260,outline:'none'}}
                />
                <button type="button" onClick={()=>void fetch()} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,border:'1px solid #E5E7EB',background:'#fff',fontSize:13,color:'#6B7280',cursor:'pointer'}}>
                    <RefreshCw size={13}/> Làm mới
                </button>
            </div>
            <div style={{background:'#fff',borderRadius:10,border:'1px solid #E5E7EB',overflow:'hidden'}}>
                <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead><tr style={{background:'#F9FAFB'}}>
                            <th style={thS}>ID</th><th style={thS}>Người vi phạm</th><th style={thS}>Loại</th>
                            <th style={thS}>Lý do</th><th style={thS}>Ngày vi phạm</th><th style={thS}>Bắt đầu phạt</th>
                            <th style={thS}>Hết hạn phạt</th><th style={thS}>Lần thứ</th>
                        </tr></thead>
                        <tbody>
                            {loading && Array.from({length:5}).map((_,i)=>(
                                <tr key={i}>{Array.from({length:8}).map((__,j)=>(
                                    <td key={j} style={{padding:'12px 14px'}}><div style={{height:13,background:'#F3F4F6',borderRadius:4}}/></td>
                                ))}</tr>
                            ))}
                            {!loading && data?.content.length === 0 && (
                                <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#9CA3AF',fontSize:14}}>Chưa có lịch sử vi phạm nào</td></tr>
                            )}
                            {!loading && data?.content.map((v: ViolationHistoryResponse)=>(
                                <tr key={v.id} style={{borderBottom:'1px solid #F3F4F6'}}>
                                    <td style={{padding:'12px 14px',fontSize:12,color:'#9CA3AF'}}>#{v.id}</td>
                                    <td style={{padding:'12px 14px',fontSize:13,color:'#374151',fontWeight:500}}>{v.violatorId}</td>
                                    <td style={{padding:'12px 14px'}}><TargetBadge type={v.targetType as ReportTargetType}/></td>
                                    <td style={{padding:'12px 14px',fontSize:13,color:'#374151'}}>{REPORT_REASON_LABELS[v.reason as keyof typeof REPORT_REASON_LABELS] ?? v.reason}</td>
                                    <td style={{padding:'12px 14px',fontSize:12,color:'#6B7280'}}>{formatDate(v.violationAt)}</td>
                                    <td style={{padding:'12px 14px',fontSize:12,color:'#6B7280'}}>{formatDate(v.penaltyStartAt)}</td>
                                    <td style={{padding:'12px 14px',fontSize:12,color: v.penaltyEndAt ? '#EF4444' : '#8B5CF6',fontWeight:500}}>{formatDate(v.penaltyEndAt)}</td>
                                    <td style={{padding:'12px 14px',textAlign:'center'}}>
                                        <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'4px 10px',borderRadius:8,background: v.violationCount >= 3 ? '#FEF2F2' : '#F0FDF4',color: v.violationCount >= 3 ? '#DC2626' : '#16A34A',fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>
                                            {v.violationCount === 1 ? 'Nhắc nhở' : `Lần ${v.violationCount - 1}`}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data && data.totalPages > 1 && (
                    <div style={{padding:'10px 14px',borderTop:'1px solid #E5E7EB',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:13,color:'#6B7280'}}>
                        <span>{data.totalElements} bản ghi</span>
                        <div style={{display:'flex',gap:4,alignItems:'center'}}>
                            <button type="button" onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{width:30,height:30,borderRadius:6,border:'1px solid #E5E7EB',background:page===0?'#F9FAFB':'#fff',color:page===0?'#D1D5DB':'#374151',cursor:page===0?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ChevronLeft size={15}/></button>
                            <span style={{padding:'0 8px',fontWeight:500,color:'#374151'}}>{page+1}/{data.totalPages}</span>
                            <button type="button" onClick={()=>setPage(p=>Math.min(data.totalPages-1,p+1))} disabled={page>=data.totalPages-1} style={{width:30,height:30,borderRadius:6,border:'1px solid #E5E7EB',background:page>=data.totalPages-1?'#F9FAFB':'#fff',color:page>=data.totalPages-1?'#D1D5DB':'#374151',cursor:page>=data.totalPages-1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ChevronRight size={15}/></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Penalty Config Tab ─────────────────────────────────────────────────

function PenaltyConfigTab() {
    const [configs, setConfigs] = useState<PenaltyConfigResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState<number|null>(null);
    const [editDays, setEditDays] = useState(0);
    const [editPerm, setEditPerm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Sidebar states
    const [activeConfig, setActiveConfig] = useState<PenaltyConfigResponse | null>(null);
    const [users, setUsers] = useState<PenalizedUserResponse[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersPage, setUsersPage] = useState(0);
    const [usersTotalPages, setUsersTotalPages] = useState(1);
    const [expandedType, setExpandedType] = useState<string | null>(null);

    const fetchConfigs = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try { const r = await violationApi.getPenaltyConfigs(); setConfigs(r.data.data); }
        catch { /* ignore */ } finally { if (showLoading) setLoading(false); }
    }, []);

    useWebSocket('post', '/topic/admin', (event) => {
        if (event.eventType === 'PENALTY_CONFIG_UPDATED') {
            void fetchConfigs(false); // background fetch, no loading screen
        }
    });

    useEffect(() => { void fetchConfigs(); }, [fetchConfigs]);

    const fetchUsers = useCallback(async (c: PenaltyConfigResponse, page: number) => {
        setUsersLoading(true);
        try {
            const res = await violationApi.getUsersByViolationCount(c.targetType, c.offenseNumber, page, 10);
            setUsers(res.data.data.content);
            setUsersTotalPages(res.data.data.totalPages);
        } catch { /* */ } finally { setUsersLoading(false); }
    }, []);

    useEffect(() => {
        if (activeConfig) {
            void fetchUsers(activeConfig, usersPage);
        }
    }, [activeConfig, usersPage, fetchUsers]);

    const handleCardClick = (c: PenaltyConfigResponse) => {
        if (activeConfig?.id === c.id) {
            setActiveConfig(null);
        } else {
            setActiveConfig(c);
            setUsersPage(0);
        }
    };

    const startEdit = (e: React.MouseEvent, c: PenaltyConfigResponse) => { 
        e.stopPropagation();
        setEditId(c.id); setEditDays(c.penaltyDays); setEditPerm(c.permanent); 
    };
    const cancelEdit = (e: React.MouseEvent) => { e.stopPropagation(); setEditId(null); };

    const saveEdit = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setSaving(true);
        try {
            await violationApi.updatePenaltyConfig(id, { penaltyDays: editDays, permanent: editPerm });
            await fetchConfigs();
            setEditId(null);
            if (activeConfig && activeConfig.id === id) {
                setActiveConfig(prev => prev ? { ...prev, penaltyDays: editDays, permanent: editPerm } : null);
            }
        } catch { /* ignore */ } finally { setSaving(false); }
    };

    const toggleActive = async (e: React.MouseEvent, c: PenaltyConfigResponse) => {
        e.stopPropagation();
        if (c.offenseNumber === 1) {
            alert('Không thể tắt mức Nhắc nhở đầu tiên!');
            return;
        }
        try {
            await violationApi.updatePenaltyConfig(c.id, { 
                penaltyDays: c.penaltyDays, 
                permanent: c.permanent,
                active: !c.active
            });
            await fetchConfigs(false);
        } catch (err: any) { alert(err.response?.data?.message || 'Có lỗi xảy ra'); }
    };

    const handleCreate = async (targetType: string) => {
        try {
            await violationApi.createPenaltyConfig({ targetType, penaltyDays: 7, permanent: false });
            // websocket event will trigger fetchConfigs(false), but we can also manually call it just in case
            await fetchConfigs(false);
        } catch { alert('Có lỗi xảy ra khi tạo mức phạt mới'); }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc muốn xóa mức phạt này? (Các mức phạt sau sẽ được dồn lên)')) return;
        try {
            await violationApi.deletePenaltyConfig(id);
            await fetchConfigs(false);
            if (activeConfig?.id === id) setActiveConfig(null);
        } catch (err: any) { alert(err.response?.data?.message || 'Có lỗi xảy ra'); }
    };

    const grouped = configs.reduce<Record<string, PenaltyConfigResponse[]>>((acc, c) => {
        (acc[c.targetType] ??= []).push(c);
        return acc;
    }, {});

    // Ensure all TARGET_TYPEs have an array
    TARGET_FILTER_OPTIONS.forEach(opt => {
        if (!grouped[opt.value]) grouped[opt.value] = [];
    });

    const typeColor: Record<string,{bg:string,color:string}> = {
        POST:          {bg:'#EFF6FF',color:'#2563EB'},
        COMMENT:       {bg:'#F5F3FF',color:'#7C3AED'},
        COMMENT_REPLY: {bg:'#FFF7ED',color:'#C2410C'},
    };

    return (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#92400E',display:'flex',alignItems:'center',gap:8}}>
                    <AlertTriangle size={15}/> Thay đổi config sẽ áp dụng cho các vi phạm <strong>mới</strong> tiếp theo, không ảnh hưởng đến vi phạm đã được xử lý.
                </div>
                {loading ? <div style={{textAlign:'center',padding:40,color:'#9CA3AF'}}>Đang tải...</div> : TARGET_FILTER_OPTIONS.map(opt => {
                    const type = opt.value;
                    const list = grouped[type] || [];
                    const isExpanded = expandedType === type;
                    return (
                        <div key={type} style={{background:'#F9FAFB',borderRadius:12,border:'1px solid #E5E7EB'}}>
                            <div 
                                onClick={() => setExpandedType(isExpanded ? null : type)}
                                style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:20,cursor:'pointer'}}
                            >
                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                    <span style={{padding:'4px 12px',borderRadius:9999,fontSize:13,fontWeight:600,...(typeColor[type]??{bg:'#F3F4F6',color:'#6B7280'})}}>
                                        {opt.label}
                                    </span>
                                    <span style={{fontSize:13,color:'#6B7280'}}>{list.length} mức phạt</span>
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:12}}>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); void handleCreate(type); }}
                                        style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:8,background:'#3B82F6',color:'#fff',border:'none',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                                        + Thêm mức
                                    </button>
                                    <div style={{color:'#6B7280',display:'flex'}}>
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div style={{padding:'0 20px 20px',display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:16}}>
                                    {list.sort((a,b)=>a.offenseNumber-b.offenseNumber).map(c => {
                                    const isReminder = c.penaltyDays === 0 && !c.permanent;
                                    const isActive = activeConfig?.id === c.id;
                                    return (
                                        <div key={c.id} onClick={() => handleCardClick(c)}
                                            style={{
                                                background:'#fff',
                                                borderRadius:12,
                                                border:`2px solid ${isActive ? '#3B82F6' : '#E5E7EB'}`,
                                                boxShadow: isActive ? '0 4px 6px -1px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                                                padding:16,
                                                cursor:'pointer',
                                                transition:'all 0.2s',
                                                display:'flex',
                                                flexDirection:'column',
                                                gap:12,
                                                position:'relative',
                                                opacity: c.active ? 1 : 0.6,
                                                filter: c.active ? 'none' : 'grayscale(0.8)'
                                            }}
                                        >
                                            {/* Header */}
                                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                                    <div style={{padding:'4px 10px',borderRadius:8,background: c.active ? '#F3F4F6' : '#E5E7EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color: c.active ? '#374151' : '#9CA3AF',whiteSpace:'nowrap', textDecoration: c.active ? 'none' : 'line-through'}}>
                                                        {c.offenseNumber === 1 ? 'Nhắc nhở' : (c.permanent ? 'Vĩnh viễn' : `Lần ${c.offenseNumber - 1}`)}
                                                    </div>
                                                    {isReminder ? (
                                                        <span style={{background:'#FEF3C7',color:'#D97706',padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700}}>NHẮC NHỞ</span>
                                                    ) : (
                                                        <span style={{background:'#FEE2E2',color:'#DC2626',padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700}}>PHẠT</span>
                                                    )}
                                                </div>
                                                <div style={{display:'flex',gap:6}}>
                                                    {c.offenseNumber > 1 && (
                                                        <button onClick={e => void handleDelete(e, c.id)} title="Xóa" style={{background:'transparent',border:'none',color:'#9CA3AF',cursor:'pointer',padding:4}}>
                                                            <Trash2 size={15}/>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Body */}
                                            {editId === c.id ? (
                                                <div style={{background:'#F9FAFB',padding:10,borderRadius:8,display:'flex',flexDirection:'column',gap:10}} onClick={e => e.stopPropagation()}>
                                                    <div style={{display:'flex',gap:10,alignItems:'center'}}>
                                                        <input type="number" min={0} value={editDays} onChange={e=>setEditDays(Number(e.target.value))}
                                                            style={{width:70,padding:'6px 10px',border:'1px solid #3B82F6',borderRadius:6,fontSize:13,outline:'none'}}/>
                                                        <span style={{fontSize:13,color:'#374151'}}>ngày</span>
                                                    </div>
                                                    <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13,color:'#374151'}}>
                                                        <input type="checkbox" checked={editPerm} onChange={e=>setEditPerm(e.target.checked)} style={{width:15,height:15}}/>
                                                        Vĩnh viễn
                                                    </label>
                                                    <div style={{display:'flex',gap:6,marginTop:4}}>
                                                        <button type="button" onClick={e=>void saveEdit(e, c.id)} disabled={saving}
                                                            style={{flex:1,padding:'6px',borderRadius:6,border:'none',background:'#22C55E',color:'#fff',fontSize:12,fontWeight:600,cursor:saving?'not-allowed':'pointer'}}>
                                                            {saving?'...':'Lưu'}
                                                        </button>
                                                        <button type="button" onClick={cancelEdit} style={{flex:1,padding:'6px',borderRadius:6,border:'1px solid #E5E7EB',background:'#fff',fontSize:12,color:'#6B7280',cursor:'pointer'}}>Hủy</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                                                    <div style={{fontSize:14,color:'#374151',fontWeight:500}}>
                                                        Thời gian phạt: <span style={{fontWeight:700,color:c.permanent?'#7C3AED':'#111827'}}>{c.permanent ? 'Vĩnh viễn' : `${c.penaltyDays} ngày`}</span>
                                                    </div>
                                                    <button type="button" onClick={e=>startEdit(e, c)}
                                                        style={{alignSelf:'flex-start',display:'flex',alignItems:'center',gap:4,padding:0,border:'none',background:'transparent',color:'#3B82F6',fontSize:12,fontWeight:600,cursor:'pointer',marginTop:4}}>
                                                        <Edit2 size={13}/> Chỉnh sửa
                                                    </button>
                                                </div>
                                            )}

                                            {/* Footer (Admin info) */}
                                            <div style={{marginTop:'auto',paddingTop:12,borderTop:'1px solid #F3F4F6',display:'flex',alignItems:'center',gap:8}}>
                                                {c.adminAvatarUrl ? (
                                                    <img src={c.adminAvatarUrl} alt="" style={{width:24,height:24,borderRadius:'50%',objectFit:'cover'}} />
                                                ) : (
                                                    <div style={{width:24,height:24,borderRadius:'50%',background:'#E5E7EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#6B7280'}}>
                                                        {c.adminName ? c.adminName.charAt(0).toUpperCase() : 'A'}
                                                    </div>
                                                )}
                                                <div style={{display:'flex',flexDirection:'column'}}>
                                                    <span style={{fontSize:11,fontWeight:600,color:'#374151'}}>{c.adminName || 'Admin'}</span>
                                                    <span style={{fontSize:10,color:'#9CA3AF'}}>{timeAgo(c.updatedAt || c.createdAt || null)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Right Sidebar: Users List */}
            {activeConfig && (
                <div style={{ width: 340, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', position: 'sticky', top: 20 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
                                DS Vi phạm - {activeConfig.offenseNumber === 1 ? 'Nhắc nhở' : (activeConfig.permanent ? 'Vĩnh viễn' : `Lần ${activeConfig.offenseNumber - 1}`)}
                            </h3>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>
                                {TARGET_TYPE_LABELS[activeConfig.targetType as ReportTargetType]}
                            </p>
                        </div>
                        <button onClick={() => setActiveConfig(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                            <XCircle size={18} />
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
                        {usersLoading ? (
                            <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF', fontSize: 13 }}>Đang tải danh sách...</div>
                        ) : users.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                <ShieldAlert size={32} opacity={0.3} />
                                Chưa có ai ở mức phạt này
                            </div>
                        ) : (
                            users.map(u => (
                                <div key={u.userId} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.15s', cursor: 'pointer' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    {u.avatarUrl ? (
                                        <img src={u.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                                            {u.userName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.userName}</div>
                                        <div style={{ fontSize: 11, color: '#6B7280' }}>Bị phạt {timeAgo(u.lastViolationAt)}</div>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
                                        #{u.userId}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {usersTotalPages > 1 && (
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                            <button disabled={usersPage === 0} onClick={() => setUsersPage(p => p - 1)}
                                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: usersPage === 0 ? 'not-allowed' : 'pointer' }}>
                                <ChevronLeft size={14} color={usersPage === 0 ? '#D1D5DB' : '#374151'} />
                            </button>
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{usersPage + 1} / {usersTotalPages}</span>
                            <button disabled={usersPage >= usersTotalPages - 1} onClick={() => setUsersPage(p => p + 1)}
                                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: usersPage >= usersTotalPages - 1 ? 'not-allowed' : 'pointer' }}>
                                <ChevronRight size={14} color={usersPage >= usersTotalPages - 1 ? '#D1D5DB' : '#374151'} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────

export default function AdminReportsPage() {
    const navigate = useNavigate();
    const [mainTab, setMainTab] = useState<'overview'|'reports'|'violations'|'configs'>('overview');
    const [targetType, setTargetType] = useState<ReportTargetType>('POST');
    const [status, setStatus]         = useState<ReportStatus | ''>('');
    const [page, setPage]             = useState(0);

    const [data, setData]       = useState<ReportPageResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const [reviewTarget,  setReviewTarget]  = useState<ReportItemResponse | null>(null);
    const [deleteTarget,  setDeleteTarget]  = useState<number | null>(null);

    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
    const [reportDetail, setReportDetail] = useState<ReportAdminDetailResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const PAGE_SIZE = 10;

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await reportApi.getReports(
                targetType,
                status === '' ? undefined : status,
                page,
                PAGE_SIZE,
            );
            setData(res.data.data);
        } catch {
            setError('Không thể tải danh sách báo cáo. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [targetType, status, page]);

    useEffect(() => { void fetchReports(); }, [fetchReports]);

    useEffect(() => {
        if (selectedReportId === null) {
            setReportDetail(null);
            return;
        }
        setDetailLoading(true);
        reportApi.getReportAdminDetail(selectedReportId)
            .then(res => setReportDetail(res.data.data))
            .catch(err => console.error(err))
            .finally(() => setDetailLoading(false));
    }, [selectedReportId]);

    const handleTargetChange = (t: ReportTargetType) => { setTargetType(t); setPage(0); setSelectedReportId(null); };
    const handleStatusChange = (s: ReportStatus | '') => { setStatus(s); setPage(0); setSelectedReportId(null); };

    const handleReviewDone = async () => { setReviewTarget(null); await fetchReports(); };
    const handleDeleteDone = async () => { setDeleteTarget(null); await fetchReports(); };

    const thStyle: React.CSSProperties = {
        padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
        color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em',
        whiteSpace: 'nowrap', borderBottom: '1px solid #E5E7EB',
    };

    const tabDefs = [
        { key: 'overview',   label: 'Tổng quan',        icon: <BarChart2 size={14}/> },
        { key: 'reports',    label: 'Báo cáo',          icon: <FileText size={14}/> },
        { key: 'violations', label: 'Lịch sử vi phạm',  icon: <History size={14}/> },
        { key: 'configs',    label: 'Cấu hình phạt',    icon: <Settings size={14}/> },
    ] as const;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", color: '#111827' }}>

            {/* Shimmer keyframe */}
            <style>{`
                @keyframes shimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>

            {/* Page header */}
            <div style={{ marginBottom: 16 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827', display:'flex', alignItems:'center', gap:10 }}>
                    <ShieldAlert size={22} color="#3B82F6"/> Báo cáo &amp; Vi phạm
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                    Quản lý báo cáo, lịch sử vi phạm và cấu hình mức phạt
                </p>
            </div>

            {/* Main tabs */}
            <div style={{display:'flex',gap:4,background:'#F3F4F6',borderRadius:10,padding:4,marginBottom:18,width:'fit-content'}}>
                {tabDefs.map(t=>(
                    <button key={t.key} type="button" onClick={()=>setMainTab(t.key)}
                        style={{display:'flex',alignItems:'center',gap:6,padding:'7px 18px',borderRadius:7,border:'none',
                            background: mainTab===t.key ? '#fff' : 'transparent',
                            boxShadow: mainTab===t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            fontSize:13,fontWeight: mainTab===t.key ? 600 : 400,
                            color: mainTab===t.key ? '#111827' : '#6B7280',cursor:'pointer',transition:'all 0.15s'}}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* Overview tab */}
            {mainTab === 'overview' && <OverviewSection/>}

            {/* Violation History tab */}
            {mainTab === 'violations' && <ViolationHistoryTab/>}

            {/* Penalty Config tab */}
            {mainTab === 'configs' && <PenaltyConfigTab/>}

            {/* Reports tab content */}
            {mainTab === 'reports' && <>

            {/* Filter bar */}
            <div style={{
                background: '#fff',

                borderRadius: 10,
                border: '1px solid #E5E7EB',
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
            }}>
                {/* Target type tabs */}
                <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                    {TARGET_FILTER_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleTargetChange(opt.value)}
                            style={{
                                padding: '5px 14px',
                                borderRadius: 6,
                                border: 'none',
                                background: targetType === opt.value ? '#fff' : 'transparent',
                                boxShadow: targetType === opt.value ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                fontSize: 13,
                                fontWeight: targetType === opt.value ? 600 : 400,
                                color: targetType === opt.value ? '#111827' : '#6B7280',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Status filter */}
                <div style={{ display: 'flex', gap: 4 }}>
                    {STATUS_FILTER_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleStatusChange(opt.value)}
                            style={{
                                padding: '5px 12px',
                                borderRadius: 9999,
                                border: `1px solid ${status === opt.value ? '#3B82F6' : '#E5E7EB'}`,
                                background: status === opt.value ? '#EFF6FF' : '#fff',
                                fontSize: 12,
                                fontWeight: status === opt.value ? 600 : 400,
                                color: status === opt.value ? '#2563EB' : '#6B7280',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Refresh */}
                <button
                    type="button"
                    onClick={() => { void fetchReports(); }}
                    style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        background: '#fff',
                        fontSize: 13,
                        color: '#6B7280',
                        cursor: 'pointer',
                    }}
                >
                    <RefreshCw size={14} />
                    Làm mới
                </button>
            </div>

            {/* Main Layout for Reports */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Left Side: Master List */}
                <div style={{
                    flex: selectedReportId !== null ? '0 0 32%' : '1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: 'all 0.3s'
                }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Đang tải danh sách...</div>
                    )}
                    
                    {!loading && error && (
                        <div style={{ textAlign: 'center', padding: 40, color: '#EF4444' }}>
                            <AlertTriangle size={28} />
                            <p>{error}</p>
                        </div>
                    )}
                    
                    {!loading && !error && data && data.items.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                            <Flag size={32} />
                            <p>Không có báo cáo nào</p>
                        </div>
                    )}

                    {!loading && !error && data && data.items.map(item => (
                        <div
                            key={item.reportId}
                            onClick={() => setSelectedReportId(item.reportId)}
                            style={{
                                background: '#fff',
                                borderRadius: 12,
                                border: `1px solid ${selectedReportId === item.reportId ? '#3B82F6' : '#E5E7EB'}`,
                                padding: 16,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: selectedReportId === item.reportId ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {item.violatorAvatar ? (
                                        <img src={item.violatorAvatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontWeight: 600 }}>
                                            {item.violatorName?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                                            {item.violatorName || 'Người ẩn danh'}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <TargetBadge type={item.targetType} />
                                            <span>•</span>
                                            {timeAgo(item.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                <StatusBadge status={item.status} />
                            </div>
                            <div style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', padding: '8px 12px', borderRadius: 8 }}>
                                <strong style={{ color: '#111827' }}>Lý do:</strong> {REPORT_REASON_LABELS[item.reason] ?? item.reason}
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {!loading && !error && data && data.totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 10 }}>
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                            >
                                Trước
                            </button>
                            <span style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>{page + 1} / {data.totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
                                disabled={page >= data.totalPages - 1}
                                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: page >= data.totalPages - 1 ? 'not-allowed' : 'pointer' }}
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side: Detail View (70%) */}
                {selectedReportId !== null && (
                    <div style={{
                        flex: '1',
                        minWidth: 0,
                        background: '#fff',
                        borderRadius: 12,
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'sticky',
                        top: 20,
                        maxHeight: 'calc(100vh - 40px)'
                    }}>
                        {detailLoading ? (
                            <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>Đang tải chi tiết...</div>
                        ) : reportDetail ? (
                            <>
                                {/* Header */}
                                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                                        {/* Violator */}
                                        <div 
                                            onClick={() => navigate(`/admin/users/interests?userId=${reportDetail.violatorUserId}`)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 12px', borderRadius: 8, transition: 'background 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <img src={reportDetail.violatorAvatar || 'https://ui-avatars.com/api/?name=' + (reportDetail.violatorName || '?')} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                                            <div>
                                                <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Người vi phạm</div>
                                                <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{reportDetail.violatorName || 'Ẩn danh'}</div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ width: 1, height: 32, background: '#D1D5DB' }}></div>

                                        {/* Reporter */}
                                        <div 
                                            onClick={() => navigate(`/admin/users/interests?userId=${reportDetail.reporterId}`)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 12px', borderRadius: 8, transition: 'background 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <img src={reportDetail.reporterAvatar || 'https://ui-avatars.com/api/?name=' + (reportDetail.reporterName || '?')} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                                            <div>
                                                <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Người báo cáo</div>
                                                <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{reportDetail.reporterName || 'Ẩn danh'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedReportId(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                                        <XCircle size={24} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                        <TargetBadge type={reportDetail.targetType} />
                                        <StatusBadge status={reportDetail.status} />
                                        <div style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={14} /> {timeAgo(reportDetail.createdAt)}
                                        </div>
                                    </div>

                                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: 16, borderRadius: 8, marginBottom: 24 }}>
                                        <h4 style={{ margin: '0 0 8px 0', color: '#991B1B', fontSize: 14 }}>Lý do báo cáo:</h4>
                                        <p style={{ margin: 0, color: '#7F1D1D', fontSize: 14, fontWeight: 500 }}>{REPORT_REASON_LABELS[reportDetail.reason] ?? reportDetail.reason}</p>
                                        {reportDetail.description && (
                                            <p style={{ margin: '8px 0 0 0', color: '#991B1B', fontSize: 13 }}>"{reportDetail.description}"</p>
                                        )}
                                    </div>

                                    {/* Target Content */}
                                    <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                                        <div style={{ background: '#F3F4F6', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                                            Nội dung bị báo cáo
                                        </div>
                                        <div style={{ padding: 16 }}>
                                            {reportDetail.contentDeleted ? (
                                                <div style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                                                    <Ban size={18} /> Nội dung này đã bị xóa khỏi hệ thống.
                                                </div>
                                            ) : reportDetail.targetContent ? (
                                                <div>
                                                    <p style={{ margin: '0 0 16px 0', fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: '#111827' }}>
                                                        {reportDetail.targetContent.content || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Không có văn bản</span>}
                                                    </p>
                                                    
                                                    {/* Media */}
                                                    {'mediaUrls' in reportDetail.targetContent && reportDetail.targetContent.mediaUrls && reportDetail.targetContent.mediaUrls.length > 0 && (
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 16 }}>
                                                            {reportDetail.targetContent.mediaUrls.map((url, i) => (
                                                                <img key={i} src={url} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }} />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Stats */}
                                                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6B7280', marginTop: 16, paddingTop: 16, borderTop: '1px dashed #E5E7EB' }}>
                                                        {('viewCount' in reportDetail.targetContent) && (
                                                            <span>Lượt xem: <strong>{reportDetail.targetContent.viewCount}</strong></span>
                                                        )}
                                                        {('likeCount' in reportDetail.targetContent) && (
                                                            <span>Lượt thích: <strong>{reportDetail.targetContent.likeCount}</strong></span>
                                                        )}
                                                        <span>Thời gian đăng: {reportDetail.targetContent.createdAt ? new Date(reportDetail.targetContent.createdAt).toLocaleString() : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Không có dữ liệu snapshot.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', background: '#F9FAFB', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                    {reportDetail.status === 'PENDING' ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    const item = data?.items.find(i => i.reportId === reportDetail.reportId);
                                                    if(item) setReviewTarget(item);
                                                }}
                                                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                            >
                                                <ShieldAlert size={16} /> Xử lý vi phạm
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteTarget(reportDetail.reportId)}
                                            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <Trash2 size={16} /> Xóa báo cáo
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Modals */}
            {reviewTarget && (
                <ReviewModal
                    report={reviewTarget}
                    onClose={() => setReviewTarget(null)}
                    onDone={() => { void handleReviewDone(); }}
                />
            )}
            {deleteTarget !== null && (
                <ConfirmDeleteModal
                    reportId={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onDone={() => { void handleDeleteDone(); }}
                />
            )}
            </>}
        </div>
    );
}