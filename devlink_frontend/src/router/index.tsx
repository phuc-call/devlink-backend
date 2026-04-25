import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';

const isAuthenticated = () => !!localStorage.getItem('accessToken');

function PrivateRoute({ children }: { children: React.ReactNode }) {
    return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    return !isAuthenticated() ? <>{children}</> : <Navigate to="/" replace />;
}

const router = createBrowserRouter([
    {
        path: '/login',
        element: <PublicRoute><LoginPage /></PublicRoute>,
    },
    {
        path: '/register',
        element: <PublicRoute><RegisterPage /></PublicRoute>,
    },
    {
        path: '/',
        element: (
            <PrivateRoute>
                <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
                    <h1 className="text-2xl font-bold text-[#111827]">Trang chủ — Coming soon</h1>
                </div>
            </PrivateRoute>
        ),
    },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}