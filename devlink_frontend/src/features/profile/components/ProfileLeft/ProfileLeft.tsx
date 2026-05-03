import type { UserProfileResponse } from '../../../../types/profile.types';
import styles from './ProfileLeft.module.css';

const LANG_LABELS: Record<string, string> = {
    JAVASCRIPT: 'JavaScript', TYPESCRIPT: 'TypeScript', PYTHON: 'Python',
    JAVA: 'Java', GO: 'Go', RUST: 'Rust', CPP: 'C++', CSHARP: 'C#',
    KOTLIN: 'Kotlin', SWIFT: 'Swift', PHP: 'PHP', RUBY: 'Ruby',
};

interface Props {
    profile: UserProfileResponse | null;
}

export default function ProfileLeft({ profile }: Props) {
    return (
        <div className={styles.wrap}>
            {/* ── Giới thiệu ─────────────────────────────────── */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Giới thiệu</h2>
                    <button className={styles.editBtn}>Chỉnh sửa</button>
                </div>

                {profile?.bio ? (
                    <p className={styles.bio}>{profile.bio}</p>
                ) : (
                    <button className={styles.addBtn}>+ Thêm tiểu sử</button>
                )}

                <div className={styles.infoList}>
                    {profile?.school && (
                        <div className={styles.infoRow}>
                            <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                            </svg>
                            <span>Học tại <strong>{profile.school}</strong></span>
                        </div>
                    )}

                    {profile?.major && (
                        <div className={styles.infoRow}>
                            <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <rect x="2" y="3" width="20" height="14" rx="2"/>
                                <path d="M8 21h8M12 17v4"/>
                            </svg>
                            <span>Ngành <strong>{profile.major}</strong></span>
                        </div>
                    )}

                    {!profile?.school && !profile?.major && (
                        <button className={styles.addBtn}>+ Thêm trường học / ngành học</button>
                    )}
                </div>

                {/* Programming languages */}
                {profile?.favoriteLanguage && profile.favoriteLanguage.length > 0 && (
                    <div className={styles.langSection}>
                        <div className={styles.infoRow}>
                            <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <polyline points="16 18 22 12 16 6"/>
                                <polyline points="8 6 2 12 8 18"/>
                            </svg>
                            <span>Ngôn ngữ yêu thích</span>
                        </div>
                        <div className={styles.langTags}>
                            {profile.favoriteLanguage.map(lang => (
                                <span key={lang} className={styles.langTag}>
                                    {LANG_LABELS[lang] ?? lang}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Profile completion */}
                {(profile?.completionPercent ?? 0) < 100 && (
                    <div className={styles.completionWrap}>
                        <div className={styles.completionTop}>
                            <span className={styles.completionLabel}>Hoàn thiện hồ sơ</span>
                            <span className={styles.completionPct}>{profile?.completionPercent ?? 0}%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${profile?.completionPercent ?? 0}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Ảnh ────────────────────────────────────────── */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Ảnh</h2>
                    <button className={styles.seeAllBtn}>Xem tất cả</button>
                </div>
                <div className={styles.photoGrid}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className={styles.photoCell}>
                            <img
                                src={`https://picsum.photos/seed/photo${(profile?.id ?? 1) + i}/120/120`}
                                alt=""
                                className={styles.photoImg}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Bạn bè / Following ─────────────────────────── */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Người đang theo dõi</h2>
                    <button className={styles.seeAllBtn}>Xem tất cả</button>
                </div>
                <p className={styles.friendCount}>{profile?.followingCount ?? 0} người đang theo dõi</p>
                <div className={styles.friendGrid}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={styles.friendCell}>
                            <img
                                src={`https://ui-avatars.com/api/?name=User+${i + 1}&background=random&size=80`}
                                alt=""
                                className={styles.friendAvatar}
                            />
                            <span className={styles.friendName}>Người dùng {i + 1}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}