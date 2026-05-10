import { useEffect, useState } from 'react';
import { userProfileApi } from '../../../api/user-service/userProfileApi';
import type { UserProfileResponse } from '../../../types/profile.types';
import ProfileBanner from '../components/ProfileBanner/ProfileBanner.tsx';
import ProfileSidebar from '../components/ProfileSidebar/ProfileSidebar.tsx';
import ProfileContent from '../components/ProfileContent/ProfileContent.tsx';
import FollowListPanel from '../components/FollowListPanel/Followlistpanel.tsx';
import EditProfilePanel from '../components/EditProfilePanel/EditProfilePanel';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('Bài viết');

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

    const isFollowTab = activeTab === 'Đang theo dõi';

    return (
        <div className={styles.page}>
            <ProfileBanner
                profile={profile}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {isFollowTab ? (
                // Full width, no sidebar
                <div className={styles.followWrap}>
                    <FollowListPanel />
                </div>
            ) : (
                <div className={styles.body}>
                    <aside className={styles.sidebar}>
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
            )}
        </div>
    );
}