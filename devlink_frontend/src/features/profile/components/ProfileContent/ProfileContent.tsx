// src/features/profile/components/ProfileContent.tsx
import { useState, useEffect } from 'react';
import styles from './ProfileContent.module.css';
import CreatePostModal from '../../../../components/post/CreatePostModal/CreatePostModal.tsx';
import { getCurrentUserInfo } from '../../../../utils/auth';

export default function ProfileContent() {
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string | undefined>(undefined);

    useEffect(() => {
        getCurrentUserInfo()
            .then(info => {
                if (info) {
                    setAvatarUrl(info.avatar);
                    setDisplayName(info.userName);
                }
            })
            .catch(() => { /* silently ignore */ });
    }, []);

    return (
        <div className={styles.wrap}>

            {showCreatePost && (
                <CreatePostModal
                    onClose={() => setShowCreatePost(false)}
                    onSuccess={() => {
                        // TODO: reload danh sách bài viết của profile
                    }}
                    avatarUrl={avatarUrl ?? undefined}
                    displayName={displayName}
                />
            )}

            {/* Create post */}
            <div className={styles.createCard}>
                <div className={styles.createRow}>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="avatar"
                            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                    ) : (
                        <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: '#E4E6EB', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, fontWeight: 600, color: '#6B7280',
                        }}>
                            {displayName ? displayName.charAt(0).toUpperCase() : ''}
                        </div>
                    )}
                    <button
                        className={styles.createInput}
                        onClick={() => setShowCreatePost(true)}
                    >
                        Bạn đang nghĩ gì?
                    </button>
                </div>
                <div className={styles.createDivider} />
                <div className={styles.createActions}>
                    <button
                        className={styles.createAction}
                        onClick={() => setShowCreatePost(true)}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" />
                        </svg>
                        Video
                    </button>
                    <button
                        className={styles.createAction}
                        onClick={() => setShowCreatePost(true)}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        Ảnh / Video
                    </button>
                    <button
                        className={styles.createAction}
                        onClick={() => setShowCreatePost(true)}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Bài viết
                    </button>
                </div>
            </div>
        </div>
    );
}