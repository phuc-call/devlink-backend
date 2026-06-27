import { Navigate, Outlet } from 'react-router-dom';
import { isAdmin } from '../../../utils/auth';

const isLoggedIn = () => localStorage.getItem('isLoggedIn') === 'true';

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
