import { Navigate, Outlet } from 'react-router-dom';
import { isAdmin } from '../../../utils/auth';

export function PublicGuard() {
    const token = localStorage.getItem('accessToken');
    return !token ? <Outlet /> : <Navigate to="/" replace />;
}

export function PrivateGuard() {
    const token = localStorage.getItem('accessToken');
    return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AdminGuard() {
    const token = localStorage.getItem('accessToken');
    if (!token) return <Navigate to="/login" replace />;
    return isAdmin() ? <Outlet /> : <Navigate to="/" replace />;
}
