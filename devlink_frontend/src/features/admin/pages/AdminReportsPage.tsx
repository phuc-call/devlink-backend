// src/features/admin/pages/AdminReportsPage.tsx
// Gọi API thật — không hard code, không dữ liệu tĩnh

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
} from 'lucide-react';
import { reportApi } from '../../../api/post-service/reportApi';
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

// ── Helpers ────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
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

// ── Main page ──────────────────────────────────────────────────────────

export default function AdminReportsPage() {
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

    // eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(() => { void fetchReports(); }, [fetchReports]);

    // Reset về trang 0 khi đổi filter
    const handleTargetChange = (t: ReportTargetType) => {
        setTargetType(t);
        setPage(0);
    };
    const handleStatusChange = (s: ReportStatus | '') => {
        setStatus(s);
        setPage(0);
    };

    const handleReviewDone = async () => {
        setReviewTarget(null);
        await fetchReports();
    };

    const handleDeleteDone = async () => {
        setDeleteTarget(null);
        await fetchReports();
    };

    const thStyle: React.CSSProperties = {
        padding: '10px 16px',
        textAlign: 'left',
        fontSize: 12,
        fontWeight: 600,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        borderBottom: '1px solid #E5E7EB',
    };

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
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
                    Báo cáo & Vi phạm
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                    Xử lý báo cáo từ người dùng về bài viết và bình luận
                </p>
            </div>

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
        </div>
    );
}