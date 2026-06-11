import { useState } from 'react';
import { Flag, X, Loader2, Check } from 'lucide-react';
import { reportApi } from '../../api/post-service/reportApi';
import {
    REPORT_REASON_LABELS,
} from '../../types/report.types';
import type { ReportReason, ReportTargetType } from '../../types/report.types';

interface Props {
    open:        boolean;
    targetId:    number;
    targetType:  ReportTargetType;
    /** Tên hiển thị của đối tượng bị tố cáo, dùng trong label */
    targetName?: string;
    onClose:     () => void;
    onSuccess?:  () => void;
}

export default function ReportModal({open, targetId, targetType, targetName, onClose, onSuccess,
                                    }: Props) {
    const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
    const [description, setDescription]       = useState('');
    const [loading, setLoading]               = useState(false);
    const [error, setError]                   = useState('');
    const [done, setDone]                     = useState(false);

    if (!open) return null;

    const handleClose = () => {
        setSelectedReason(null);
        setDescription('');
        setError('');
        setDone(false);
        onClose();
    };

    const handleSubmit = async () => {
        if (!selectedReason) return;
        setLoading(true);
        setError('');
        try {
            await reportApi.report({
                targetId,
                targetType,
                reason:      selectedReason,
                description: description.trim() || undefined,
            });
            setDone(true);
            onSuccess?.();
        } catch (err: unknown) {
            type AxiosErrorShape = { response?: { data?: { message?: string } } };
            const msg = (err as AxiosErrorShape)?.response?.data?.message;
            if (msg?.includes('REPORT_ALREADY_SUBMITTED')) {
                setError('Bạn đã tố cáo nội dung này với lý do tương tự.');
            } else {
                setError('Gửi tố cáo thất bại, vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000,
            }}
        >
            <div style={{
                background: '#fff',
                borderRadius: 12,
                padding: '24px',
                width: 380,
                maxWidth: 'calc(100vw - 32px)',
                boxShadow: '0 20px 25px rgba(0,0,0,0.12)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 4,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Flag size={16} color="#EF4444" />
                        <span style={{ fontWeight: 600, fontSize: 15, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                            Tố cáo {targetName ? `"${targetName}"` : 'nội dung này'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {done ? (
                    /* ── Trạng thái thành công ── */
                    <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: '#F0FDF4', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 12px',
                        }}>
                            <Check size={22} color="#22C55E" />
                        </div>
                        <p style={{ fontWeight: 600, fontSize: 15, color: '#111827', margin: '0 0 6px', fontFamily: 'Inter, sans-serif' }}>
                            Đã gửi tố cáo
                        </p>
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                            Chúng tôi đã ghi nhận lời tố cáo của bạn và sẽ tiến hành xác minh trong thời gian sớm nhất.
                            Nếu bạn còn bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ.
                        </p>
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                padding: '8px 24px', borderRadius: 8, border: 'none',
                                background: '#3B82F6', color: '#fff',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            Đóng
                        </button>
                    </div>
                ) : (
                    <>
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 16px', fontFamily: 'Inter, sans-serif' }}>
                            Chọn lý do phù hợp để chúng tôi xem xét nhanh hơn.
                        </p>

                        {/* Reason list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                            {(Object.entries(REPORT_REASON_LABELS) as [ReportReason, string][]).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setSelectedReason(value)}
                                    style={{
                                        textAlign: 'left',
                                        border: selectedReason === value ? '1.5px solid #3B82F6' : '1px solid #E5E7EB',
                                        borderRadius: 8,
                                        padding: '9px 12px',
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        background: selectedReason === value ? '#EFF6FF' : '#fff',
                                        color: selectedReason === value ? '#1D4ED8' : '#374151',
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        fontFamily: 'Inter, sans-serif',
                                        transition: 'all 0.12s',
                                    }}
                                >
                                    {selectedReason === value && <Check size={13} color="#3B82F6" />}
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Optional description */}
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            placeholder="Mô tả thêm (không bắt buộc)..."
                            rows={3}
                            style={{
                                width: '100%', borderRadius: 8,
                                border: '1px solid #E5E7EB', padding: '8px 12px',
                                fontSize: 13, color: '#374151', resize: 'vertical',
                                fontFamily: 'Inter, sans-serif', outline: 'none',
                                boxSizing: 'border-box', marginBottom: 4,
                            }}
                        />
                        <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
                            {description.length}/500
                        </div>

                        {error && (
                            <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 10px', fontFamily: 'Inter, sans-serif' }}>
                                {error}
                            </p>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={handleClose}
                                style={{
                                    padding: '8px 16px', borderRadius: 8,
                                    border: '1px solid #E5E7EB', background: '#fff',
                                    fontSize: 13, cursor: 'pointer', color: '#374151',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                Huỷ
                            </button>
                            <button
                                type="button"
                                onClick={() => { void handleSubmit(); }}
                                disabled={!selectedReason || loading}
                                style={{
                                    padding: '8px 16px', borderRadius: 8, border: 'none',
                                    background: selectedReason && !loading ? '#EF4444' : '#FCA5A5',
                                    color: '#fff', fontSize: 13, fontWeight: 600,
                                    cursor: selectedReason && !loading ? 'pointer' : 'not-allowed',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                {loading && <Loader2 size={13} style={{ animation: 'spin .8s linear infinite' }} />}
                                Gửi tố cáo
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}