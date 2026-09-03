import { Outlet } from 'react-router-dom';
import Header from '../MainLayout/Header';
import styles from './ChatLayout.module.css';

export default function ChatLayout() {
    return (
        <div className={styles.root}>
            <Header />
            <div className={styles.body}>
                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
