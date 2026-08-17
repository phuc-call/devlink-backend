import { useState } from 'react';
import MyActivityTab from './MyActivityTab';
import CommentReplyHistoryTab from './CommentReplyHistoryTab';
import styles from '../pages/UserDashboardPage/UserDashboardPage.module.css';

type Tab = 'my-activity' | 'my-comments' | 'interaction';

export default function ReactHistorySection() {
    const [activeTab, setActiveTab] = useState<Tab>('my-activity');

    return (
        <div className={styles.activitySection}>
            <div className={styles.activityHeader}>
                <h2 className={styles.activityTitle}>Activity Management</h2>
            </div>

            <div className={styles.tabBar}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'my-activity' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('my-activity')}
                >
                    My Activity
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'my-comments' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('my-comments')}
                >
                    My Comments
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'interaction' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('interaction')}
                >
                    Interaction Management
                </button>
            </div>

            {activeTab === 'my-activity' && <MyActivityTab />}

            {activeTab === 'my-comments' && <CommentReplyHistoryTab />}

            {activeTab === 'interaction' && (
                <div className={styles.comingDevelopmentFull}>
                    <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className={styles.comingTitle}>Coming Soon</p>
                    <p className={styles.comingDesc}>Interaction management features will be available soon.</p>
                </div>
            )}
        </div>
    );
}
