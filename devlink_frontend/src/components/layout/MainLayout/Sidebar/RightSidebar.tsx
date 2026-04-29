import styles from './RightSidebar.module.css';

export default function RightSidebar() {
    return (
        <div className={styles.sidebar}>
            {/* ── Khung 1: Thông báo Admin ── */}
            <section className={styles.box}>
                <h4 className={styles.boxTitle}>Thông báo</h4>
                <div className={styles.boxBody} />
            </section>

            {/* ── Khung 2: Quảng cáo / Sponsor ── */}
            <section className={styles.box}>
                <h4 className={styles.boxTitle}>Dành cho bạn</h4>
                <div className={styles.boxBody} />
            </section>
        </div>
    );
}