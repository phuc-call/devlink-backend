import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import LeftSidebar from './Sidebar/LeftSidebar';
import RightSidebar from './Sidebar/RightSidebar';

import ProfileSetupModal from '../../../features/profile/components/ProfileSetupModal';
import { useProfileSetup } from '../../../hooks/useProfileSetup';
import styles from './MainLayout.module.css';

export default function MainLayout() {
    const { showModal, closeModal, nudgeSentCount, avatarUrl, fullName } = useProfileSetup();

    const location = useLocation();
    const isFriends = location.pathname.startsWith('/friends');
    const isGroups = location.pathname.startsWith('/groups');
    const isWideLayout = isFriends || isGroups;

    return (
        <div className={styles.root}>
            {showModal && <ProfileSetupModal onClose={closeModal} nudgeSentCount={nudgeSentCount} avatarUrl={avatarUrl} initialFullName={fullName} />}
            <Header />
            <div className={`${styles.body} ${isWideLayout ? styles.bodyWide : ''}`}>
                <aside className={isWideLayout ? styles.leftFixed : styles.left}>
                    <LeftSidebar />
                </aside>
                <main className={`${styles.feed} ${isWideLayout ? styles.feedWide : ''}`}>
                    <Outlet />
                </main>
                {!isWideLayout && (
                    <aside className={styles.right}>
                        <RightSidebar />
                    </aside>
                )}
            </div>
        </div>
    );
}