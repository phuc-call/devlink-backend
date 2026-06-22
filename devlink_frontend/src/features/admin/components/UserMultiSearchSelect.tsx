import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { badgeApi } from '../../../api/user-service/badgeApi';
import type { UserSummaryResponse } from '../../../types/badge.types';
import { BADGE_LABELS, BADGE_COLORS } from '../../../types/badge.types';

interface Props {
    /** Danh sách user đã chọn (mỗi user có sẵn username + avatar + badge hiện tại từ API search) */
    values: UserSummaryResponse[];
    onChange: (users: UserSummaryResponse[]) => void;
    placeholder?: string;
}


export default function UserMultiSearchSelect({
    values,
    onChange,
    placeholder = 'Tìm theo username hoặc email để thêm user...',
}: Props) {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState<UserSummaryResponse[]>([]);
    const [open, setOpen] = useState(false);
    const [searching, setSearching] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!keyword.trim()) {
            setResults([]);
            setOpen(false);
            return;
        }
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await badgeApi.searchUsers(keyword, 0, 8);
                setResults(res.data.data.content);
                setOpen(true);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 400);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [keyword]);

    const isSelected = (id: number) => values.some(u => u.id === id);
    const availableResults = results.filter(u => !isSelected(u.id));

    const handleAdd = (user: UserSummaryResponse) => {
        if (!isSelected(user.id)) {
            onChange([...values, user]);
        }
        setKeyword('');
        setOpen(false);
        setResults([]);
    };

    const handleRemove = (id: number) => {
        onChange(values.filter(u => u.id !== id));
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            {values.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {values.map(user => (
                        <div key={user.id} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '5px 8px 5px 5px', borderRadius: 10,
                            border: '1px solid #3B82F6', background: '#EFF6FF',
                        }}>
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: '#DBEAFE', display: 'grid', placeItems: 'center',
                                    fontSize: 10, fontWeight: 700, color: '#1D4ED8',
                                }}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{user.username}</span>
                            <span style={{
                                padding: '1px 6px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                background: BADGE_COLORS[user.badge].bg,
                                color: BADGE_COLORS[user.badge].color,
                            }}>
                                {BADGE_LABELS[user.badge]}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleRemove(user.id)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: '#6B7280', display: 'flex' }}
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                    type="text"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder={placeholder}
                    style={{
                        width: '100%', padding: '12px 12px 12px 38px',
                        borderRadius: 12, border: '1px solid #E5E7EB',
                        fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    }}
                />
                {searching && (
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9CA3AF' }}>
                        Đang tìm...
                    </div>
                )}
            </div>

            {open && availableResults.length > 0 && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: '#fff', borderRadius: 12, marginTop: 4,
                    border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    maxHeight: 280, overflowY: 'auto',
                }}>
                    {availableResults.map(user => (
                        <div
                            key={user.id}
                            // dùng onMouseDown + preventDefault — xem giải thích trong UserSearchSelect.tsx
                            onMouseDown={e => {
                                e.preventDefault();
                                handleAdd(user);
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 14px', cursor: 'pointer',
                                borderBottom: '1px solid #F3F4F6',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: '#F3F4F6', display: 'grid', placeItems: 'center',
                                    fontSize: 13, fontWeight: 700, color: '#374151',
                                }}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{user.username}</div>
                                <div style={{ fontSize: 12, color: '#6B7280' }}>{user.email}</div>
                            </div>
                            <span style={{
                                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                background: BADGE_COLORS[user.badge].bg,
                                color: BADGE_COLORS[user.badge].color,
                                border: `1px solid ${BADGE_COLORS[user.badge].border}`,
                            }}>
                                {BADGE_LABELS[user.badge]}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {open && availableResults.length === 0 && !searching && keyword.trim() && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: '#fff', borderRadius: 12, marginTop: 4,
                    border: '1px solid #E5E7EB', padding: '14px 16px',
                    fontSize: 13, color: '#6B7280',
                }}>
                    Không tìm thấy user nào (hoặc user đã được chọn).
                </div>
            )}
        </div>
    );
}
