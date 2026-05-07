import type { UserProfileResponse } from '../../../../types/profile.types';
import styles from './UserProfileContent.module.css';

interface Props {
    profile: UserProfileResponse | null;
}

export default function UserProfileContent({ profile }: Props) {
    return (
        <div className={styles.wrap}>
            {/* Placeholder — sẽ thêm Post list của user này sau */}
            <div className={styles.emptyCard}>
                <div className={styles.emptyIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                         stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <line x1="10" y1="9" x2="8" y2="9"/>
                    </svg>
                </div>
                <p className={styles.emptyTitle}>
                    {profile?.fullName
                        ? `${profile.fullName} chưa có bài viết nào`
                        : 'Chưa có bài viết nào'}
                </p>
                <p className={styles.emptySub}>Bài viết của người dùng này sẽ hiển thị ở đây</p>
            </div>
        </div>
    );
}