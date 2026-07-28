// src/features/admin/pages/AdminReportsPage.tsx

import React, { useCallback, useEffect, useState } from 'react';
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
} from 'lucide-react';
import { reportApi } from '../../../api/post-service/reportApi';
import { violationApi } from '../../../api/post-service/violationApi';
import type {
    ReportItemResponse,
    ReportPageResponse,
    ReportTargetType,
    ReportStatus,
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
} from '../../../types/violation.types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';


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
                            Cấm vĩnh viễn (mặc định: 7 ngày)
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
    const [data, setData] = useState<ViolationOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        violationApi.getOverview()
            .then(r => setData(r.data.data))
            .catch(() => null)
            .finally(() => setLoading(false));
    }, []);

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

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
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
                                        <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:'50%',background: v.violationCount >= 3 ? '#FEF2F2' : '#F0FDF4',color: v.violationCount >= 3 ? '#DC2626' : '#16A34A',fontSize:13,fontWeight:700}}>{v.violationCount}</span>
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

    const fetchConfigs = useCallback(async () => {
        setLoading(true);
        try { const r = await violationApi.getPenaltyConfigs(); setConfigs(r.data.data); }
        catch { /* ignore */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { void fetchConfigs(); }, [fetchConfigs]);

    const startEdit = (c: PenaltyConfigResponse) => { setEditId(c.id); setEditDays(c.penaltyDays); setEditPerm(c.permanent); };
    const cancelEdit = () => setEditId(null);

    const saveEdit = async (id: number) => {
        setSaving(true);
        try {
            await violationApi.updatePenaltyConfig(id, { penaltyDays: editDays, permanent: editPerm });
            await fetchConfigs();
            setEditId(null);
        } catch { /* ignore */ } finally { setSaving(false); }
    };

    const grouped = configs.reduce<Record<string, PenaltyConfigResponse[]>>((acc, c) => {
        (acc[c.targetType] ??= []).push(c);
        return acc;
    }, {});

    const typeColor: Record<string,{bg:string,color:string}> = {
        POST:          {bg:'#EFF6FF',color:'#2563EB'},
        COMMENT:       {bg:'#F5F3FF',color:'#7C3AED'},
        COMMENT_REPLY: {bg:'#FFF7ED',color:'#C2410C'},
    };

    return (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
            <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#92400E',display:'flex',alignItems:'center',gap:8}}>
                <AlertTriangle size={15}/> Thay đổi config sẽ áp dụng cho các vi phạm <strong>mới</strong> tiếp theo, không ảnh hưởng đến vi phạm đã được xử lý.
            </div>
            {loading ? <div style={{textAlign:'center',padding:40,color:'#9CA3AF'}}>Đang tải...</div> : Object.entries(grouped).map(([type, list])=>(
                <div key={type} style={{background:'#fff',borderRadius:10,border:'1px solid #E5E7EB',overflow:'hidden'}}>
                    <div style={{padding:'12px 16px',borderBottom:'1px solid #E5E7EB',display:'flex',alignItems:'center',gap:8}}>
                        <span style={{padding:'3px 10px',borderRadius:9999,fontSize:12,fontWeight:600,...(typeColor[type]??{bg:'#F3F4F6',color:'#6B7280'})}}>{TARGET_TYPE_LABELS[type as ReportTargetType]??type}</span>
                        <span style={{fontSize:12,color:'#9CA3AF'}}>{list.length} mức phạt</span>
                    </div>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead><tr style={{background:'#F9FAFB'}}>
                            <th style={{padding:'9px 14px',fontSize:11,fontWeight:600,color:'#6B7280',textAlign:'left',textTransform:'uppercase'}}>Lần vi phạm</th>
                            <th style={{padding:'9px 14px',fontSize:11,fontWeight:600,color:'#6B7280',textAlign:'left',textTransform:'uppercase'}}>Số ngày phạt</th>
                            <th style={{padding:'9px 14px',fontSize:11,fontWeight:600,color:'#6B7280',textAlign:'left',textTransform:'uppercase'}}>Vĩnh viễn</th>
                            <th style={{padding:'9px 14px',fontSize:11,fontWeight:600,color:'#6B7280',textAlign:'center',textTransform:'uppercase'}}>Hành động</th>
                        </tr></thead>
                        <tbody>
                            {list.sort((a,b)=>a.offenseNumber-b.offenseNumber).map(c=>(
                                <tr key={c.id} style={{borderBottom:'1px solid #F3F4F6'}}>
                                    <td style={{padding:'11px 14px',fontSize:13}}>
                                        <span style={{background:'#F3F4F6',borderRadius:6,padding:'2px 10px',fontWeight:600,color:'#374151'}}>Lần {c.offenseNumber}</span>
                                    </td>
                                    <td style={{padding:'11px 14px',fontSize:13,color:'#374151'}}>
                                        {editId===c.id ? (
                                            <input type="number" min={0} value={editDays} onChange={e=>setEditDays(Number(e.target.value))}
                                                style={{width:70,padding:'4px 8px',border:'1px solid #3B82F6',borderRadius:6,fontSize:13,outline:'none'}}/>
                                        ) : (
                                            <span style={{fontWeight:600,color: c.permanent?'#8B5CF6':'#111827'}}>{c.permanent ? '—' : `${c.penaltyDays} ngày`}</span>
                                        )}
                                    </td>
                                    <td style={{padding:'11px 14px'}}>
                                        {editId===c.id ? (
                                            <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}}>
                                                <input type="checkbox" checked={editPerm} onChange={e=>setEditPerm(e.target.checked)} style={{width:15,height:15}}/>
                                                <span style={{color:'#6B7280'}}>Vĩnh viễn</span>
                                            </label>
                                        ) : (
                                            <span style={{padding:'2px 8px',borderRadius:9999,fontSize:11,fontWeight:600,background:c.permanent?'#F5F3FF':'#F3F4F6',color:c.permanent?'#7C3AED':'#6B7280'}}>
                                                {c.permanent?'Có':'Không'}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{padding:'11px 14px',textAlign:'center'}}>
                                        {editId===c.id ? (
                                            <div style={{display:'flex',gap:6,justifyContent:'center'}}>
                                                <button type="button" onClick={()=>void saveEdit(c.id)} disabled={saving}
                                                    style={{display:'flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:7,border:'none',background:'#22C55E',color:'#fff',fontSize:12,fontWeight:600,cursor:saving?'not-allowed':'pointer'}}>
                                                    <Save size={13}/>{saving?'...':'Lưu'}
                                                </button>
                                                <button type="button" onClick={cancelEdit} style={{padding:'5px 10px',borderRadius:7,border:'1px solid #E5E7EB',background:'#fff',fontSize:12,color:'#6B7280',cursor:'pointer'}}>Hủy</button>
                                            </div>
                                        ) : (
                                            <button type="button" onClick={()=>startEdit(c)}
                                                style={{display:'flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:7,border:'1px solid #E5E7EB',background:'#fff',color:'#374151',fontSize:12,cursor:'pointer',margin:'0 auto'}}>
                                                <Edit2 size={13}/> Sửa
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────

export default function AdminReportsPage() {
    const [mainTab, setMainTab] = useState<'overview'|'reports'|'violations'|'configs'>('overview');
    const [targetType, setTargetType] = useState<ReportTargetType>('POST');
    const [status, setStatus]         = useState<ReportStatus | ''>('');
    const [page, setPage]             = useState(0);

    const [data, setData]       = useState<ReportPageResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const [reviewTarget,  setReviewTarget]  = useState<ReportItemResponse | null>(null);
    const [deleteTarget,  setDeleteTarget]  = useState<number | null>(null);

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

    const handleTargetChange = (t: ReportTargetType) => { setTargetType(t); setPage(0); };
    const handleStatusChange = (s: ReportStatus | '') => { setStatus(s); setPage(0); };

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

            {/* Table card */}
            <div style={{
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}>

                {/* Error state */}
                {error && !loading && (
                    <div style={{
                        padding: 32,
                        textAlign: 'center',
                        color: '#EF4444',
                        fontSize: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <AlertTriangle size={28} color="#EF4444" />
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => { void fetchReports(); }}
                            style={{
                                marginTop: 4,
                                padding: '6px 16px',
                                borderRadius: 8,
                                border: '1px solid #E5E7EB',
                                background: '#fff',
                                fontSize: 13,
                                cursor: 'pointer',
                                color: '#374151',
                            }}
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Table */}
                {!error && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ background: '#F9FAFB' }}>
                                <th style={thStyle}>ID</th>
                                <th style={thStyle}>Loại</th>
                                <th style={thStyle}>Người vi phạm</th>
                                <th style={thStyle}>Người báo cáo</th>
                                <th style={thStyle}>Lý do</th>
                                <th style={thStyle}>Trạng thái</th>
                                <th style={thStyle}>Thời gian</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Hành động</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading && Array.from({ length: 5 }).map((_, i) => (
                                <SkeletonRow key={i} />
                            ))}
                            {!loading && data && data.items.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ padding: 40, textAlign: 'center' }}>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 10,
                                            color: '#9CA3AF',
                                        }}>
                                            <Flag size={32} strokeWidth={1.4} />
                                            <p style={{ fontSize: 14, margin: 0 }}>Không có báo cáo nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && data && data.items.map(item => (
                                <tr
                                    key={item.reportId}
                                    style={{
                                        borderBottom: '1px solid #F3F4F6',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#F9FAFB'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                                >
                                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                                        #{item.reportId}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <TargetBadge type={item.targetType} />
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                                        {item.violatorName ?? (
                                            <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>–</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151' }}>
                                        {item.reporterName ?? (
                                            <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>–</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', maxWidth: 180 }}>
                                        <div style={{ fontWeight: 500 }}>
                                            {REPORT_REASON_LABELS[item.reason] ?? item.reason}
                                        </div>
                                        {item.description && (
                                            <div style={{
                                                fontSize: 12,
                                                color: '#6B7280',
                                                marginTop: 2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                maxWidth: 160,
                                            }}>
                                                {item.description}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                                        {timeAgo(item.createdAt)}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                            {/* Xem chi tiết (link đến targetId) */}
                                            <a
                                                href={`/post/${item.targetId}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Xem nội dung"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    border: '1px solid #E5E7EB',
                                                    background: '#fff',
                                                    color: '#6B7280',
                                                    textDecoration: 'none',
                                                    transition: 'all 0.15s',
                                                }}
                                                onMouseEnter={e => {
                                                    (e.currentTarget as HTMLAnchorElement).style.background = '#F3F4F6';
                                                    (e.currentTarget as HTMLAnchorElement).style.color = '#374151';
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget as HTMLAnchorElement).style.background = '#fff';
                                                    (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280';
                                                }}
                                            >
                                                <Eye size={15} />
                                            </a>

                                            {/* Xử lý — chỉ PENDING */}
                                            {item.status === 'PENDING' && (
                                                <button
                                                    type="button"
                                                    title="Xử lý báo cáo"
                                                    onClick={() => setReviewTarget(item)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 8,
                                                        border: '1px solid #BFDBFE',
                                                        background: '#EFF6FF',
                                                        color: '#2563EB',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={e => {
                                                        (e.currentTarget as HTMLButtonElement).style.background = '#DBEAFE';
                                                    }}
                                                    onMouseLeave={e => {
                                                        (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF';
                                                    }}
                                                >
                                                    <ShieldAlert size={15} />
                                                </button>
                                            )}

                                            {/* Xóa — chỉ RESOLVED / REJECTED */}
                                            {item.status !== 'PENDING' && (
                                                <button
                                                    type="button"
                                                    title="Xóa báo cáo"
                                                    onClick={() => setDeleteTarget(item.reportId)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 8,
                                                        border: '1px solid #FECACA',
                                                        background: '#FEF2F2',
                                                        color: '#DC2626',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={e => {
                                                        (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2';
                                                    }}
                                                    onMouseLeave={e => {
                                                        (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2';
                                                    }}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && data && data.totalPages > 1 && (
                    <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        color: '#6B7280',
                    }}>
                        <span>
                            Hiển thị {data.items.length} / {data.totalElements} báo cáo
                        </span>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                style={{
                                    width: 32, height: 32,
                                    borderRadius: 8,
                                    border: '1px solid #E5E7EB',
                                    background: page === 0 ? '#F9FAFB' : '#fff',
                                    color: page === 0 ? '#D1D5DB' : '#374151',
                                    cursor: page === 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span style={{ padding: '0 8px', fontWeight: 500, color: '#374151' }}>
                                {page + 1} / {data.totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
                                disabled={page >= data.totalPages - 1}
                                style={{
                                    width: 32, height: 32,
                                    borderRadius: 8,
                                    border: '1px solid #E5E7EB',
                                    background: page >= data.totalPages - 1 ? '#F9FAFB' : '#fff',
                                    color: page >= data.totalPages - 1 ? '#D1D5DB' : '#374151',
                                    cursor: page >= data.totalPages - 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
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