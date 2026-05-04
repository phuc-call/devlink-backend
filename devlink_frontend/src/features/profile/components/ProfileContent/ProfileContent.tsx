import styles from './ProfileContent.module.css';

export default function ProfileContent() {
    return (
        <div className={styles.wrap}>

            {/* Create post */}
            <div className={styles.createCard}>
                <div className={styles.createRow}>
                    <div className={styles.createAvatar} />
                    <button className={styles.createInput}>
                        Bạn đang nghĩ gì?
                    </button>
                </div>
                <div className={styles.createDivider} />
                <div className={styles.createActions}>
                    <button className={styles.createAction}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2"/>
                        </svg>
                        Video
                    </button>
                    <button className={styles.createAction}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        Ảnh / Video
                    </button>
                    <button className={styles.createAction}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        Bài viết
                    </button>
                </div>
            </div>

            {/* Empty state */}
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
                <p className={styles.emptyTitle}>Chưa có bài viết nào</p>
                <p className={styles.emptySub}>Những gì bạn chia sẻ sẽ hiển thị ở đây</p>
            </div>

        </div>
    );
}