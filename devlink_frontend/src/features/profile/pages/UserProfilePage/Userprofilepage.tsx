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

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        setError(false);

        userProfileApi.getUserProfile(Number(userId))
            .then(res => setProfile(res.data.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
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

    return (
        <div className={styles.page}>
            <UserProfileBanner profile={profile} />
            <div className={styles.body}>
                <aside className={styles.sidebar}>
                    <UserProfileSidebar profile={profile} />
                </aside>
                <main className={styles.content}>
                    <UserProfileContent profile={profile} />
                </main>
            </div>
        </div>
    );
}