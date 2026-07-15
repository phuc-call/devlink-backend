import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import LeftSidebar from './Sidebar/LeftSidebar';
import RightSidebar from './Sidebar/RightSidebar';

import ProfileSetupModal from '../../../features/profile/components/ProfileSetupModal';
import { useProfileSetup } from '../../../hooks/useProfileSetup';
import { useWebSocket, WsEvent } from '../../../hooks/useWebSocket';
import { WS_EVENTS } from '../../../constants/wsEvents';
import styles from './MainLayout.module.css';

export default function MainLayout() {
    const { showModal, closeModal, nudgeSentCount, avatarUrl, fullName } = useProfileSetup();
    const userId = localStorage.getItem('userId');

    useWebSocket('user', `/topic/user/${userId}`, (event: WsEvent) => {
        if (event.eventType === WS_EVENTS.PAYLOAD_NEW_NOTIFICATION) {
            window.dispatchEvent(new CustomEvent(WS_EVENTS.WINDOW_NEW_NOTIFICATION));
        } else if (event.eventType === WS_EVENTS.PAYLOAD_BLOCK_UPDATED) {
            window.dispatchEvent(new CustomEvent(WS_EVENTS.WINDOW_BLOCK_UPDATED));
        }
    });

    const location = useLocation();
    const isFriends = location.pathname.startsWith('/friends');
    const isGroups = location.pathname.startsWith('/groups');
    const isFeedPage = location.pathname === '/friends/feed' || location.pathname === '/groups/feed';
    const isWideLayout = (isFriends || isGroups) && !isFeedPage;

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