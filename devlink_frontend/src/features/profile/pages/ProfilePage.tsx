import { useEffect, useState } from 'react';
import { userProfileApi } from '../../../api/user-service/userProfileApi';
import type { UserProfileResponse } from '../../../types/profile.types';
import ProfileHeader from '../components/ProfileHeader/ProfileHeader';
import ProfileLeft from '../components/ProfileLeft/ProfileLeft';
import ProfileRight from '../components/ProfileRight/ProfileRight';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        userProfileApi.getProfile()
            .then(res => setProfile(res.data.data))
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Cover + Avatar + Tên + Nav — full width */}
            <ProfileHeader profile={profile} />

            {/* 2 cột 40/60 */}
            <div className={styles.body}>
                <div className={styles.left}>
                    <ProfileLeft profile={profile} />
                </div>
                <div className={styles.right}>
                    <ProfileRight />
                </div>
            </div>
        </div>
    );
}