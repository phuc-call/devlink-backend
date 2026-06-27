import { Outlet } from 'react-router-dom';
import Header from './Header';
import LeftSidebar from './Sidebar/LeftSidebar';
import RightSidebar from './Sidebar/RightSidebar';
import BottomNav from './BottomNav/BottomNav';
import ProfileSetupModal from '../../../features/profile/components/ProfileSetupModal';
import { useProfileSetup } from '../../../hooks/useProfileSetup';
import styles from './MainLayout.module.css';

export default function MainLayout() {
    const { showModal, closeModal } = useProfileSetup();

    return (
        <div className={styles.root}>
            {showModal && <ProfileSetupModal onClose={closeModal} />}
            <Header />
            <div className={styles.body}>
                <aside className={styles.left}>
                    <LeftSidebar />
                </aside>
                <main className={styles.feed}>
                    <Outlet />
                </main>
                <aside className={styles.right}>
                    <RightSidebar />
                </aside>
            </div>
            <BottomNav />
        </div>
    );
}