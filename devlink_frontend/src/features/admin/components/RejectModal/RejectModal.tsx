import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import styles from './RejectModal.module.css';

interface Props {
    suggestionId: number;
    onConfirm: (reason: string) => Promise<void>;
    onClose: () => void;
}

export default function RejectModal({ onConfirm, onClose }: Props) {
    const [reason, setReason]   = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError('Vui lòng nhập lý do từ chối.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await onConfirm(reason.trim());
        } catch {
            setError('Từ chối thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.backdrop}>
            <div className={styles.dialog}>
                <div className={styles.dialogHeader}>
                    <div className={styles.dialogTitle}>
                        <AlertTriangle size={16} color="#F59E0B" />
                        Từ chối đề xuất
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className={styles.dialogBody}>
                    <label className={styles.label}>
                        Lý do từ chối <span className={styles.required}>*</span>
                    </label>
                    <textarea
                        className={styles.textarea}
                        value={reason}
                        onChange={e => setReason(e.target.value.slice(0, 500))}
                        placeholder="Nhập lý do từ chối để thông báo cho người dùng..."
                        rows={4}
                        disabled={loading}
                    />
                    <div className={styles.charCount}>{reason.length}/500</div>

                    {error && <p className={styles.errorMsg}>{error}</p>}
                </div>

                <div className={styles.dialogFooter}>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                        Huỷ
                    </button>
                    <button
                        className={styles.confirmBtn}
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                    </button>
                </div>
            </div>
        </div>
    );
}