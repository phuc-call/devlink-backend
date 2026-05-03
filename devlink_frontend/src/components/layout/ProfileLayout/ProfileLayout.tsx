import { Outlet } from 'react-router-dom';
import Header from '../MainLayout/Header/index.tsx';
import styles from './ProfileLayout.module.css';

export default function ProfileLayout() {
    return (
        <div className={styles.root}>
            <Header />
            <div className={styles.body}>
                <Outlet />
            </div>
        </div>
    );
}