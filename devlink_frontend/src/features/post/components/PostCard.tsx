// src/features/post/components/PostCard.tsx
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { FeedPostResponse } from '../../../types/post.types';

interface Props {
    post: FeedPostResponse;
}

export default function PostCard({ post }: Props) {
    const { author, content, mediaList, tags, createdAt, viewCount } = post;

    const timeAgo = formatDistanceToNow(new Date(createdAt), {
        addSuffix: true,
        locale: vi,
    });

    return (
        <div style={{
            background: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            marginBottom: '12px',
            overflow: 'hidden',
        }}>
            {/* Header — author info */}
            <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                    src={author?.avatarUrl || `https://ui-avatars.com/api/?name=${author?.fullName}`}
                    alt={author?.fullName}
                    style={{ width: '40px', height: '40px', borderRadius: '9999px', objectFit: 'cover' }}
                />
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                            {author?.fullName || 'Người dùng'}
                        </span>
                        {author?.badge && author.badge !== 'NONE' && (
                            <span style={{
                                background: '#DBEAFE',
                                color: '#2563EB',
                                fontSize: '11px',
                                padding: '1px 6px',
                                borderRadius: '9999px',
                                fontWeight: 500,
                            }}>
                                {author.badge === 'POPULAR' ? '⭐ Nổi bật' : '✓ Verified'}
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {timeAgo} · {post.visibility === 'PUBLIC' ? '🌐 Công khai' : '👥 Bạn bè'}
                    </div>
                </div>
            </div>

            {/* Content */}
            {content && (
                <div style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', lineHeight: 1.6 }}>
                    {content}
                </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
                <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {tags.map(t => (
                        <span key={t.id} style={{
                            background: '#EFF6FF',
                            color: '#3B82F6',
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                        }}>
                            #{t.tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Media */}
            {mediaList.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                    {mediaList.map(m => (
                        <div key={m.id}>
                            {m.mediaType === 'IMAGE' && (
                                <img
                                    src={m.url}
                                    alt={m.originalName}
                                    style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
                                />
                            )}
                            {m.mediaType === 'VIDEO' && (
                                <video
                                    controls
                                    style={{ width: '100%', maxHeight: '500px', background: '#000' }}
                                >
                                    <source src={m.url} />
                                </video>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div style={{
                padding: '10px 16px',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                gap: '16px',
                fontSize: '13px',
                color: '#6B7280',
            }}>
                <span>👁 {viewCount} lượt xem</span>
                <span>❤️ Thích</span>
                <span>💬 Bình luận</span>
                <span>↗️ Chia sẻ</span>
            </div>
        </div>
    );
}