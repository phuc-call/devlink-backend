import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userProfileApi } from '../../../../api/user-service/userProfileApi';
import type { UserProfileResponse } from '../../../../types/profile.types';
import UserProfileBanner from '../../components/UserProfileBanner/Userprofilebanner.tsx';
import UserProfileSidebar from '../../components/UserProfileSidebar/Userprofilesidebar.tsx';
import UserProfileContent from '../../components/UserProfileContent/Userprofilecontent.tsx';
import styles from './UserProfilePage.module.css';

export default function UserProfilePage() {
    const { userId } = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [viewerMedia, setViewerMedia] = useState<string | null>(null);
    const [viewerLoading, setViewerLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        setError(false);

        const id = Number(userId);

        Promise.allSettled([
            userProfileApi.getUserProfile(id),
            userProfileApi.getAvatarUrl(id),
            userProfileApi.getCoverImageUrl(id)
        ]).then(([profileRes, avatarRes, coverRes]) => {
            if (profileRes.status === 'rejected') {
                setError(true);
                return;
            }

            const profileData = profileRes.value.data.data;

            if (avatarRes.status === 'fulfilled' && avatarRes.value.data.data) {
                profileData.avatarUrl = avatarRes.value.data.data;
            }
            if (coverRes.status === 'fulfilled' && coverRes.value.data.data) {
                profileData.coverImageUrl = coverRes.value.data.data;
            }

            setProfile(profileData);
        }).finally(() => {
            setLoading(false);
        });
    }, [userId]);

    if (loading) {
        return (
            <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className={styles.errorWrap}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                     stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                <p className={styles.errorTitle}>Không tìm thấy người dùng</p>
                <p className={styles.errorSub}>Hồ sơ này không tồn tại hoặc đã bị ẩn</p>
            </div>
        );
    }


    const handleAvatarClick = async () => {
        if (!userId) return;
        setViewerLoading(true);
        setViewerMedia('loading'); // open modal with loading state
        try {
            const res = await userProfileApi.getAvatarUrl(Number(userId));
            if (res.data.data) {
                setViewerMedia(res.data.data);
            } else {
                setViewerMedia(null);
                alert('Không thể tải ảnh đại diện (ảnh bị lỗi hoặc không có quyền xem).');
            }
        } catch (err) {
            setViewerMedia(null);
            alert('Bạn không có quyền xem ảnh đại diện của người này.');
        } finally {
            setViewerLoading(false);
        }
    };

    const handleCoverClick = async () => {
        if (!userId) return;
        setViewerLoading(true);
        setViewerMedia('loading');
        try {
            const res = await userProfileApi.getCoverImageUrl(Number(userId));
            if (res.data.data) {
                setViewerMedia(res.data.data);
            } else {
                setViewerMedia(null);
                alert('Không thể tải ảnh bìa (ảnh bị lỗi hoặc không có quyền xem).');
            }
        } catch (err) {
            setViewerMedia(null);
            alert('Bạn không có quyền xem ảnh bìa của người này.');
        } finally {
            setViewerLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <UserProfileBanner profile={profile} onCoverClick={handleCoverClick} />
            <div className={styles.body}>
                <aside className={styles.sidebar}>
                    <UserProfileSidebar profile={profile} onAvatarClick={handleAvatarClick} />
                </aside>
                <main className={styles.content}>
                    <UserProfileContent profile={profile} />
                </main>
            </div>

            {/* Trình xem ảnh (Image Viewer) */}
            {viewerMedia && (
                <div 
                    style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
                        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => setViewerMedia(null)}
                >
                    <button 
                        style={{
                            position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)',
                            border: 'none', color: '#fff', fontSize: '24px', width: '40px', height: '40px',
                            borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onClick={() => setViewerMedia(null)}
                    >×</button>

                    {viewerMedia === 'loading' || viewerLoading ? (
                        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <img 
                            src={viewerMedia} 
                            alt="Full screen" 
                            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} 
                            onClick={e => e.stopPropagation()}
                        />
                    )}
                </div>
            )}
        </div>
    );
}