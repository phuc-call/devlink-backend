import { useEffect, useState } from 'react';
import { userProfileApi } from '../../../api/user-service/userProfileApi';
import type { UserProfileResponse } from '../../../types/profile.types';
import ProfileBanner from '../components/ProfileBanner/ProfileBanner.tsx';
import ProfileSidebar from '../components/ProfileSidebar/ProfileSidebar.tsx';
import ProfileContent from '../components/ProfileContent/ProfileContent.tsx';
import UserProfileContent from '../components/UserProfileContent/Userprofilecontent.tsx';
import FollowListPanel from '../components/FollowListPanel/Followlistpanel.tsx';
import EditProfilePanel from '../components/EditProfilePanel/EditProfilePanel';
import ImageViewer from '../components/ImageViewer/ImageViewer';
import styles from './ProfilePage.module.css';

type FollowListType = 'FOLLOWING' | 'FOLLOWERS' | 'FRIENDS';

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('Bài viết');
    const [followTab, setFollowTab] = useState<FollowListType>('FOLLOWING');
    const [viewImage, setViewImage] = useState<{ type: 'avatar' | 'cover', userId: number } | null>(null);

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

    const handleAvatarUpdate = (newAvatarUrl: string) => {
        if (profile) {
            setProfile({ ...profile, avatarUrl: newAvatarUrl });
        }
    };

    const handleCoverUpdate = (newCoverUrl: string) => {
        if (profile) {
            setProfile({ ...profile, coverImageUrl: newCoverUrl });
        }
    };

    const handleFollowerClick = () => {
        setFollowTab('FOLLOWERS');
        setActiveTab('Đang theo dõi');
    };

    const handleFollowingClick = () => {
        setFollowTab('FOLLOWING');
        setActiveTab('Đang theo dõi');
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
                onCoverUpdate={handleCoverUpdate}
                onCoverClick={() => {
                    if (profile?.userId) setViewImage({ type: 'cover', userId: profile.userId });
                }}
            />

            {isFollowTab ? (
                <div className={styles.followWrap}>
                    <FollowListPanel
                        initialTab={followTab}
                        onTabChange={setFollowTab}
                    />
                </div>
            ) : (
                <div className={styles.body}>
                    <aside className={styles.sidebar}>
                        <ProfileSidebar
                            profile={profile}
                            onEdit={() => setIsEditing(true)}
                            onFollowerClick={handleFollowerClick}
                            onFollowingClick={handleFollowingClick}
                            onAvatarUpdate={handleAvatarUpdate}
                            onAvatarClick={() => {
                                if (profile?.userId) setViewImage({ type: 'avatar', userId: profile.userId });
                            }}
                        />
                    </aside>
                    <main className={styles.content}>
                        {isEditing ? (
                            <EditProfilePanel
                                profile={profile}
                                onDone={handleEditDone}
                                onCancel={() => setIsEditing(false)}
                            />
                        ) : (
                            <>
                                <ProfileContent />
                                <UserProfileContent profile={profile} />
                            </>
                        )}
                    </main>
                </div>
            )}

            {viewImage && (
                <ImageViewer 
                    userId={viewImage.userId} 
                    type={viewImage.type} 
                    onClose={() => setViewImage(null)} 
                />
            )}
        </div>
    );
}