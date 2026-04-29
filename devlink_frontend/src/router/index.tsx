import {createBrowserRouter, RouterProvider, Navigate, Outlet} from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import OAuth2SuccessPage from '../features/auth/pages/OAuth2SuccessPage';
import MainLayout from '../components/layout/MainLayout';
import FeedPage from '../features/post/pages/FeedPage';
import FollowingPage from '../features/post/pages/FollowingPage';
import ExplorePage from '../features/post/pages/ExplorePage';
import NotificationPage from '../features/notification/pages/NotificationPage';
import ChatPage from '../features/chat/pages/ChatPage';

// ── Guards ──────────────────────────────────────────────────────────────────
// Tách ra ngoài createBrowserRouter để React nhận diện stable component type
// → không unmount/remount khi navigate

function PrivateGuard() {
    const token = localStorage.getItem('accessToken');
    return token ? <Outlet/> : <Navigate to="/login" replace/>;
}

function PublicGuard() {
    const token = localStorage.getItem('accessToken');
    return !token ? <Outlet/> : <Navigate to="/" replace/>;
}

const router = createBrowserRouter([
    // Public routes — chỉ truy cập khi chưa đăng nhập
    {
        element: <PublicGuard/>,
        children: [
            {path: '/login', element: <LoginPage/>},
            {path: '/register', element: <RegisterPage/>},
        ],
    },

    // OAuth callback — không cần guard
    {path: '/oauth2/success', element: <OAuth2SuccessPage/>},

    // Private routes — phải đăng nhập
    {
        element: <PrivateGuard/>,
        children: [
            {
                element: <MainLayout/>,
                children: [
                    {path: '/', element: <FeedPage/>},
                    {path: '/following', element: <FollowingPage/>},
                    {path: '/explore', element: <ExplorePage/>},
                    {path: '/notifications', element: <NotificationPage/>},
                    {path: '/chat', element: <ChatPage/>},
                ],
            },
        ],
    },

    // Fallback
    {path: '*', element: <Navigate to="/" replace/>},
]);

export default function AppRouter() {
    return <RouterProvider router={router}/>;
}