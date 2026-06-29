import { userProfileApi } from '../../../../api/user-service/userProfileApi';
import type { UserProfileResponse } from '../../../../types/profile.types';
import styles from './ProfileBanner.module.css';

interface Props {
    profile: UserProfileResponse | null;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onCoverUpdate?: (newCoverUrl: string) => void;
    onCoverClick?: () => void;
}

const TABS = ['Bài viết', 'Giới thiệu', 'Đang theo dõi', 'Ảnh'];

export default function ProfileBanner({ profile, activeTab, onTabChange, onCoverUpdate, onCoverClick }: Props) {
    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await userProfileApi.updateCoverImage(formData);
            if (onCoverUpdate) onCoverUpdate(res.data.data);
        } catch (err) {
            console.error('Failed to update cover', err);
            alert('Cập nhật ảnh bìa thất bại!');
        }
    };
    
    const coverUrl = profile?.coverImageUrl || profile?.coverAvatar;

    return (
        <div className={styles.wrap}>
            <div className={styles.banner} onClick={(e) => {
                // Ignore clicks if they click the upload button
                if ((e.target as HTMLElement).closest(`.${styles.editCoverBtn}`)) return;
                if (onCoverClick && coverUrl) onCoverClick();
            }}>
                {coverUrl
                    ? <img src={coverUrl} alt="cover" className={styles.bannerImg} style={onCoverClick ? {cursor: 'pointer'} : {}} />
                    : <div className={styles.bannerGradient} />
                }
                <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    id="cover-upload" 
                    onChange={handleCoverUpload} 
                />
                <button className={styles.editCoverBtn} onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('cover-upload')?.click();
                }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                    </svg>
                    Đổi ảnh bìa
                </button>
            </div>

            <div className={styles.navBar}>
                <div className={styles.navTabs}>
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.navTab} ${activeTab === tab ? styles.navActive : ''}`}
                            onClick={() => onTabChange(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}