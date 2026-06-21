import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { badgeApi } from '../../../api/user-service/badgeApi';
import type { UserBadgeDetailResponse } from '../../../types/badge.types';
import { BADGE_LABELS, BADGE_COLORS } from '../../../types/badge.types';

interface Props {
    userId: number | null;
    onClose: () => void;
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function UserBadgeDetailModal({ userId, onClose }: Props) {
    const [detail, setDetail] = useState<UserBadgeDetailResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        badgeApi.getUserBadgeDetail(userId)
            .then(res => setDetail(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [userId]);

    if (!userId) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div style={{
                background: '#fff', borderRadius: 20, padding: 28,
                width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto',
                boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Lịch sử badge</div>
                    <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6B7280' }}>
                        <X size={20} />
                    </button>
                </div>

                {loading && <div style={{ color: '#6B7280', textAlign: 'center', padding: 32 }}>Đang tải...</div>}

                {detail && !loading && (
                    <>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '14px 16px', borderRadius: 14,
                            background: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: 20,
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: '#111827' }}>{detail.username}</div>
                                <div style={{ fontSize: 13, color: '#6B7280' }}>{detail.email}</div>
                            </div>
                            <span style={{
                                padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                background: BADGE_COLORS[detail.currentBadge].bg,
                                color: BADGE_COLORS[detail.currentBadge].color,
                                border: `1px solid ${BADGE_COLORS[detail.currentBadge].border}`,
                            }}>
                                {BADGE_LABELS[detail.currentBadge]}
                            </span>
                        </div>

                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                            Lịch sử ({detail.history.length} lần)
                        </div>

                        <div style={{ display: 'grid', gap: 8 }}>
                            {detail.history.length === 0 && (
                                <div style={{ color: '#9CA3AF', fontSize: 13 }}>Chưa có lịch sử badge.</div>
                            )}
                            {detail.history.map((item, index) => (
                                <div key={index} style={{
                                    padding: '12px 14px', borderRadius: 12,
                                    background: '#F9FAFB', border: '1px solid #F3F4F6',
                                    display: 'flex', alignItems: 'center', gap: 12,
                                }}>
                                    <span style={{
                                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                        background: BADGE_COLORS[item.badgeType].bg,
                                        color: BADGE_COLORS[item.badgeType].color,
                                        border: `1px solid ${BADGE_COLORS[item.badgeType].border}`,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {BADGE_LABELS[item.badgeType]}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, color: '#374151' }}>
                                            Bởi <strong>{item.grantedBy}</strong>
                                            {item.followerCountSnapshot != null && (
                                                <span style={{ color: '#9CA3AF' }}> · {item.followerCountSnapshot.toLocaleString()} followers</span>
                                            )}
                                        </div>
                                        {item.reason && (
                                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.reason}</div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                                        {formatDate(item.createdAt)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}