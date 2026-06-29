import type { UserProfileResponse } from '../../../../types/profile.types';
import styles from './UserProfileBanner.module.css';

interface Props {
    profile: UserProfileResponse | null;
    onCoverClick?: () => void;
}

const TABS = ['Bài viết', 'Giới thiệu', 'Đang theo dõi', 'Ảnh'];

export default function UserProfileBanner({ profile, onCoverClick }: Props) {
    const coverUrl = profile?.coverImageUrl || profile?.coverAvatar;

    return (
        <div className={styles.wrap}>

            <div 
                className={styles.banner} 
                onClick={onCoverClick}
                style={onCoverClick ? { cursor: 'pointer' } : {}}
            >
                {coverUrl
                    ? <img src={coverUrl} alt="cover" className={styles.bannerImg} />
                    : <div className={styles.bannerGradient} />
                }
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