import type { UserProfileResponse } from '../../../../types/profile.types';
import styles from './UserProfileBanner.module.css';

interface Props {
    profile: UserProfileResponse | null;
}

const TABS = ['Bài viết', 'Giới thiệu', 'Đang theo dõi', 'Ảnh'];

export default function UserProfileBanner({ profile }: Props) {
    const coverUrl = profile?.coverImageUrl || profile?.coverAvatar;

    return (
        <div className={styles.wrap}>

            <div className={styles.banner}>
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