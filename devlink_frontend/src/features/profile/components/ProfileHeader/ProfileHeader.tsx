import type { UserProfileResponse } from '../../../../types/profile.types';
import styles from './ProfileHeader.module.css';

const LANG_LABELS: Record<string, string> = {
    JAVASCRIPT: 'JavaScript', TYPESCRIPT: 'TypeScript', PYTHON: 'Python',
    JAVA: 'Java', GO: 'Go', RUST: 'Rust', CPP: 'C++', CSHARP: 'C#',
    KOTLIN: 'Kotlin', SWIFT: 'Swift', PHP: 'PHP', RUBY: 'Ruby',
};

interface Props {
    profile: UserProfileResponse | null;
}

export default function ProfileHeader({ profile }: Props) {


    const coverUrl = profile?.coverImageUrl;
    const avatarUrl = profile?.avatarUrl;

    return (
        <div className={styles.wrap}>

            {/* ── Banner ─────────────────────────────────────── */}
            <div className={styles.banner}>
                {coverUrl
                    ? <img src={coverUrl} alt="cover" className={styles.bannerImg} />
                    : <div className={styles.bannerGradient} />
                }
                <button className={styles.bannerEditBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                    </svg>
                    Đổi ảnh bìa
                </button>
            </div>

            {/* ── Identity row ───────────────────────────────── */}
            <div className={styles.identityRow}>

                {/* Avatar */}
                <div className={styles.avatarWrap}>
                    <div className={styles.avatarRing}>
                        {avatarUrl
                            ? <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
                            : <span className={styles.avatarInitials}>{styles.fullName}</span>
                        }
                    </div>
                    <button className={styles.avatarEditBtn} title="Đổi ảnh đại diện">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                    </button>
                </div>

                {/* Name + meta */}
                <div className={styles.meta}>
                    <h1 className={styles.name}>{profile?.fullName || 'Người dùng'}</h1>

                    {profile?.bio && (
                        <p className={styles.bio}>{profile.bio}</p>
                    )}

                    <div className={styles.metaRow}>
                        {profile?.school && (
                            <span className={styles.metaItem}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                                </svg>
                                {profile.school}
                            </span>
                        )}
                        {profile?.major && (
                            <span className={styles.metaItem}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                                    <path d="M8 21h8M12 17v4"/>
                                </svg>
                                {profile.major}
                            </span>
                        )}
                        {profile?.favoriteLanguage && profile.favoriteLanguage.length > 0 && (
                            <span className={styles.metaItem}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="16 18 22 12 16 6"/>
                                    <polyline points="8 6 2 12 8 18"/>
                                </svg>
                                {profile.favoriteLanguage.map(l => LANG_LABELS[l] ?? l).join(' · ')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats + action */}
                <div className={styles.rightCol}>
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statNum}>{profile?.followerCount ?? 0}</span>
                            <span className={styles.statLabel}>Followers</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statNum}>{profile?.followingCount ?? 0}</span>
                            <span className={styles.statLabel}>Following</span>
                        </div>
                    </div>
                    <button className={styles.editBtn}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Chỉnh sửa hồ sơ
                    </button>
                </div>
            </div>

            {/* ── Nav tabs ───────────────────────────────────── */}
            <div className={styles.navBar}>
                {['Bài viết', 'Giới thiệu', 'Đang theo dõi', 'Ảnh'].map((tab, i) => (
                    <button key={tab} className={`${styles.navTab} ${i === 0 ? styles.navActive : ''}`}>
                        {tab}
                    </button>
                ))}
            </div>

        </div>
    );
}