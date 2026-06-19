import { Link } from 'react-router-dom';
import { Code2, GraduationCap, MapPin, UserRound } from 'lucide-react';
import type { UserFollowingCardResponse } from '../../../types/follow.types';

interface Props {
    user: UserFollowingCardResponse;
}

function getInitials(name?: string | null) {
    if (!name) return '?';

    return name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map(part => part.charAt(0).toUpperCase())
        .join('');
}

export default function UserFollowingCard({ user }: Props) {
    const languages = user.favoriteLanguage ?? [];

    return (
        <Link
            to={`/profile/${user.userId}`}
            style={{
                minWidth: 220,
                maxWidth: 220,
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 14,
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    height: 54,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                }}
            />

            <div style={{ padding: '0 14px 14px' }}>
                <div style={{ marginTop: -28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            style={{
                                width: 58,
                                height: 58,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '3px solid white',
                                background: '#F3F4F6',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: 58,
                                height: 58,
                                borderRadius: '50%',
                                border: '3px solid white',
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: 17,
                            }}
                        >
                            {getInitials(user.fullName)}
                        </div>
                    )}

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            color: '#2563EB',
                            background: '#EFF6FF',
                            padding: '5px 8px',
                            borderRadius: 999,
                            fontWeight: 700,
                            marginBottom: 4,
                        }}
                    >
                        <UserRound size={12} />
                        Following
                    </div>
                </div>

                <div style={{ marginTop: 10 }}>
                    <div
                        title={user.fullName}
                        style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: '#111827',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {user.fullName}
                    </div>

                    <div
                        style={{
                            minHeight: 36,
                            marginTop: 5,
                            fontSize: 12,
                            color: '#6B7280',
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {user.bio || 'Chưa có giới thiệu.'}
                    </div>

                    {(user.school || user.major) && (
                        <div
                            style={{
                                marginTop: 9,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: 12,
                                color: '#4B5563',
                            }}
                        >
                            <GraduationCap size={13} color="#6B7280" />
                            <span
                                style={{
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {[user.major, user.school].filter(Boolean).join(' • ')}
                            </span>
                        </div>
                    )}

                    {languages.length > 0 && (
                        <div
                            style={{
                                marginTop: 10,
                                display: 'flex',
                                gap: 6,
                                overflow: 'hidden',
                                alignItems: 'center',
                            }}
                        >
                            <Code2 size={13} color="#6B7280" />

                            {languages.slice(0, 2).map(language => (
                                <span
                                    key={language}
                                    style={{
                                        background: '#F3F4F6',
                                        color: '#374151',
                                        borderRadius: 999,
                                        padding: '4px 7px',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {language}
                                </span>
                            ))}

                            {languages.length > 2 && (
                                <span
                                    style={{
                                        color: '#6B7280',
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}
                                >
                                    +{languages.length - 2}
                                </span>
                            )}
                        </div>
                    )}

                    {!user.school && !user.major && languages.length === 0 && (
                        <div
                            style={{
                                marginTop: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: 12,
                                color: '#9CA3AF',
                            }}
                        >
                            <MapPin size={13} />
                            Chưa cập nhật thông tin học tập
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}