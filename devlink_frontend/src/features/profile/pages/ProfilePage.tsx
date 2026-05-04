import { useEffect, useState } from 'react';
import { userProfileApi } from '../../../api/user-service/userProfileApi';
import type { UserProfileResponse } from '../../../types/profile.types';
import ProfileBanner from '../components/ProfileBanner/ProfileBanner.tsx';
import ProfileSidebar from '../components/ProfileSidebar/ProfileSidebar.tsx';
import ProfileContent from '../components/ProfileContent/ProfileContent.tsx';
import styles from './ProfilePage.module.css';

import EditProfilePanel from '../components/EditProfilePanel/EditProfilePanel';


export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        userProfileApi.getProfile()
            .then(res => setProfile(res.data.data))
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, []);

    const handleEditDone = (updated: UserProfileResponse) => {
        setProfile(updated);
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <ProfileBanner profile={profile} />
            <div className={styles.body}>
                <aside className={styles.sidebar}>
                    {/* Truyền onEdit xuống ProfileSidebar */}
                    <ProfileSidebar profile={profile} onEdit={() => setIsEditing(true)} />
                </aside>
                <main className={styles.content}>
                    {isEditing ? (
                        <EditProfilePanel
                            profile={profile}
                            onDone={handleEditDone}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <ProfileContent />
                    )}
                </main>
            </div>
        </div>
    );
}