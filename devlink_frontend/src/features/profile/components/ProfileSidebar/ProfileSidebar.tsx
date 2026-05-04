import type { UserProfileResponse } from '../../../../types/profile.types';
import styles from './ProfileSidebar.module.css';

const LANG_LABELS: Record<string, string> = {
    JAVASCRIPT: 'JavaScript', TYPESCRIPT: 'TypeScript', PYTHON: 'Python',
    JAVA: 'Java', GO: 'Go', RUST: 'Rust', CPP: 'C++', CSHARP: 'C#',
    KOTLIN: 'Kotlin', SWIFT: 'Swift', PHP: 'PHP', RUBY: 'Ruby',
};

// Màu dot cho từng language — giống GitHub
const LANG_COLORS: Record<string, string> = {
    JAVASCRIPT: '#F7DF1E', TYPESCRIPT: '#3178C6', PYTHON: '#3572A5',
    JAVA: '#B07219', GO: '#00ADD8', RUST: '#DEA584', CPP: '#F34B7D',
    CSHARP: '#178600', KOTLIN: '#A97BFF', SWIFT: '#F05138',
    PHP: '#4F5D95', RUBY: '#701516',
};

interface Props {
    profile: UserProfileResponse | null;
    onEdit: () => void;
}

export default function ProfileSidebar({ profile,onEdit }: Props) {
    const initials = profile?.fullName
        ? profile.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
        : '?';

    return (
        <div className={styles.wrap}>


            <div className={styles.avatarBlock}>
                <div className={styles.avatarWrap}>
                    {profile?.avatarUrl
                        ? <img src={profile.avatarUrl} alt="avatar" className={styles.avatarImg} />
                        : <span className={styles.avatarInitials}>{initials}</span>
                    }
                    <button className={styles.avatarEditBtn} title="Đổi ảnh đại diện">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                    </button>
                </div>

                {/* Tên + bio */}
                <h1 className={styles.name}>{profile?.fullName || 'Người dùng'}</h1>
                {profile?.bio && <p className={styles.bio}>{profile.bio}</p>}

                {/* Stats inline */}
                <div className={styles.statsRow}>
                    <span className={styles.statItem}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <strong>{profile?.followerCount ?? 0}</strong>
                        <span>followers</span>
                    </span>
                    <span className={styles.statDot}>·</span>
                    <span className={styles.statItem}>
                        <strong>{profile?.followingCount ?? 0}</strong>
                        <span>following</span>
                    </span>
                </div>

                {/* Edit button */}
                <button className={styles.editBtn} onClick={onEdit}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Chỉnh sửa hồ sơ
                </button>
            </div>


            <div className={styles.divider} />


            <div className={styles.infoList}>
                {profile?.school && (
                    <div className={styles.infoRow}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                        </svg>
                        <span>{profile.school}</span>
                    </div>
                )}
                {profile?.major && (
                    <div className={styles.infoRow}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <rect x="2" y="3" width="20" height="14" rx="2"/>
                            <path d="M8 21h8M12 17v4"/>
                        </svg>
                        <span>{profile.major}</span>
                    </div>
                )}
                {!profile?.school && !profile?.major && (
                    <button className={styles.addInfoBtn}>+ Thêm trường học & ngành học</button>
                )}
            </div>


            {profile?.favoriteLanguage && profile.favoriteLanguage.length > 0 && (
                <>
                    <div className={styles.divider} />
                    <div className={styles.langSection}>
                        <p className={styles.langTitle}>Ngôn ngữ yêu thích</p>
                        <div className={styles.langList}>
                            {profile.favoriteLanguage.map(lang => (
                                <div key={lang} className={styles.langRow}>
                                    <span
                                        className={styles.langDot}
                                        style={{ background: LANG_COLORS[lang] ?? '#9CA3AF' }}
                                    />
                                    <span className={styles.langName}>
                                        {LANG_LABELS[lang] ?? lang}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}


            {(profile?.completionPercent ?? 0) < 100 && (
                <>
                    <div className={styles.divider} />
                    <div className={styles.completion}>
                        <div className={styles.completionHeader}>
                            <span className={styles.completionLabel}>Hoàn thiện hồ sơ</span>
                            <span className={styles.completionPct}>{profile?.completionPercent ?? 0}%</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${profile?.completionPercent ?? 0}%` }}
                            />
                        </div>
                        <p className={styles.completionHint}>
                            Bổ sung thêm thông tin để được gợi ý phù hợp hơn
                        </p>
                    </div>
                </>
            )}

        </div>
    );
}