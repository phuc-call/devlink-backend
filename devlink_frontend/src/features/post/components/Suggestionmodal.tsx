import { useState } from 'react';
import { X, MessageSquare, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { createSuggestion } from '../../../api/post-service/suggestionApi';
import type { CreateSuggestionRequest } from '../../../api/post-service/suggestionApi';
import styles from './SuggestionModal.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type SuggestionType = CreateSuggestionRequest['suggestionType'];

interface Props {
    templateId: number;
    forkId: number;
    onClose: () => void;
    onSuccess?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: SuggestionType; label: string; desc: string }[] = [
    { value: 'CONTENT_FIX',     label: 'Sửa nội dung',        desc: 'Nội dung có lỗi cần chỉnh sửa' },
    { value: 'ADD_EXPLANATION', label: 'Bổ sung giải thích',   desc: 'Cần thêm giải thích rõ hơn' },
    { value: 'REPORT_ERROR',    label: 'Báo lỗi',              desc: 'Phát hiện lỗi trong tài liệu' },
    { value: 'OTHER',           label: 'Khác',                 desc: 'Đề xuất khác' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuggestionModal({ templateId, forkId, onClose, onSuccess }: Props) {
    const [suggestionType, setSuggestionType] = useState<SuggestionType>('CONTENT_FIX');
    const [description, setDescription]       = useState('');
    const [loading, setLoading]               = useState(false);
    const [error, setError]                   = useState<string | null>(null);
    const [success, setSuccess]               = useState(false);

    const canSubmit = description.trim().length >= 10 && !loading;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        setError(null);
        try {
            const request: CreateSuggestionRequest = {
                templateId,
                forkId,
                suggestionType,
                description: description.trim(),
            };
            await createSuggestion(request);
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (err: unknown) {
            // backend trả lỗi cụ thể
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                const msg = axiosErr.response?.data?.message;
                if (msg === 'TEMPLATE_FORK_NO_CHANGES') {
                    setError('Fork của bạn chưa có thay đổi nào so với bản gốc. Hãy chỉnh sửa nội dung trước khi đề xuất.');
                } else if (msg === 'TEMPLATE_FORK_NOT_FOUND') {
                    setError('Không tìm thấy fork. Vui lòng fork template trước.');
                } else {
                    setError('Gửi đề xuất thất bại. Vui lòng thử lại.');
                }
            } else {
                setError('Gửi đề xuất thất bại. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.backdrop}>
            <div className={styles.modal}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <MessageSquare size={16} color="#3B82F6" />
                        Đề xuất sửa template
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} disabled={loading}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>

                    {/* Success state */}
                    {success && (
                        <div className={styles.successBox}>
                            <CheckCircle size={32} color="#16A34A" />
                            <p className={styles.successTitle}>Gửi đề xuất thành công!</p>
                            <p className={styles.successSub}>Admin sẽ xem xét và phản hồi sớm nhất.</p>
                        </div>
                    )}

                    {!success && (
                        <>
                            {/* Loại đề xuất */}
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Loại đề xuất <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.typeGrid}>
                                    {TYPE_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`${styles.typeCard} ${suggestionType === opt.value ? styles.typeCardActive : ''}`}
                                            onClick={() => setSuggestionType(opt.value)}
                                            disabled={loading}
                                        >
                                            <span className={styles.typeLabel}>{opt.label}</span>
                                            <span className={styles.typeDesc}>{opt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mô tả */}
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Mô tả chi tiết <span className={styles.required}>*</span>
                                </label>
                                <textarea
                                    className={styles.textarea}
                                    value={description}
                                    onChange={e => setDescription(e.target.value.slice(0, 2000))}
                                    placeholder="Mô tả cụ thể nội dung bạn muốn đề xuất sửa đổi... (tối thiểu 10 ký tự)"
                                    rows={5}
                                    disabled={loading}
                                />
                                <div className={styles.charRow}>
                                    {description.trim().length < 10 && description.length > 0 && (
                                        <span className={styles.charWarn}>
                                            Cần ít nhất 10 ký tự
                                        </span>
                                    )}
                                    <span className={styles.charCount}>{description.length}/2000</span>
                                </div>
                            </div>

                            {/* Info box */}
                            <div className={styles.infoBox}>
                                <AlertTriangle size={13} color="#92400E" />
                                <span>
                                    Fork của bạn phải có <strong>chỉnh sửa</strong> so với bản gốc trước khi đề xuất.
                                    Nếu chưa, hãy vào <strong>Sửa fork</strong> để chỉnh sửa trước.
                                </span>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className={styles.errorBox}>
                                    <AlertTriangle size={13} />
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className={styles.footer}>
                        <button
                            className={styles.cancelBtn}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Huỷ
                        </button>
                        <button
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                        >
                            {loading
                                ? <><Loader2 size={14} className={styles.spin} /> Đang gửi...</>
                                : <><MessageSquare size={14} /> Gửi đề xuất</>
                            }
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}