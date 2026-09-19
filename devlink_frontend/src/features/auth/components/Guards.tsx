import { STORAGE_KEYS, STORAGE_VALUES } from '../../../constants/storage';

import { Navigate, Outlet } from 'react-router-dom';
import { isAdmin } from '../../../utils/auth';

const isLoggedIn = () => localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === STORAGE_VALUES.LOGGED_IN_TRUE;

export function PublicGuard() {
    return !isLoggedIn() ? <Outlet /> : <Navigate to="/" replace />;
}

export function PrivateGuard() {
    return isLoggedIn() ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AdminGuard() {
    if (!isLoggedIn()) return <Navigate to="/login" replace />;
    return isAdmin() ? <Outlet /> : <Navigate to="/" replace />;
}
