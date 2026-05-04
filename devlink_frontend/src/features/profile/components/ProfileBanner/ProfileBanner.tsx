import type { UserProfileResponse } from '../../../../types/profile.types';
import styles from './ProfileBanner.module.css';

interface Props {
    profile: UserProfileResponse | null;
}

const TABS = ['Bài viết', 'Giới thiệu', 'Đang theo dõi', 'Ảnh'];

export default function ProfileBanner({ profile }: Props) {
    const coverUrl = profile?.coverImageUrl || profile?.coverAvatar;

    return (
        <div className={styles.wrap}>
            {/* Banner */}
            <div className={styles.banner}>
                {coverUrl
                    ? <img src={coverUrl} alt="cover" className={styles.bannerImg} />
                    : <div className={styles.bannerGradient} />
                }
                <button className={styles.editCoverBtn}>
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
                    {TABS.map((tab, i) => (
                        <button
                            key={tab}
                            className={`${styles.navTab} ${i === 0 ? styles.navActive : ''}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}