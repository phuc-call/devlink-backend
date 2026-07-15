// src/router/index.tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import { PublicGuard, PrivateGuard, AdminGuard } from '../features/auth/components/Guards';

import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import OAuth2SuccessPage from '../features/auth/pages/OAuth2SuccessPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';

import MainLayout from '../components/layout/MainLayout';
import FeedPage from '../features/post/pages/FeedPage';
import FollowingPage from '../features/post/pages/FollowingPage';
import FriendsPage from '../features/post/pages/FriendsPage';
import FriendsFeedPage from '../features/post/pages/FriendsFeedPage';
import ExplorePage from '../features/post/pages/ExplorePage';
import CreateGroupPage from '../features/post/pages/CreateGroupPage';
import GroupDetailPage from '../features/post/pages/GroupDetailPage';
import NotificationPage from '../features/notification/pages/NotificationPage';
import HiddenContentPage from '../features/hidden/pages/HiddenContentPage';
import ChatPage from '../features/chat/pages/ChatPage';
import MyViolationsPage from '../features/notification/pages/MyViolationsPage/MyViolationsPage.tsx';
import ProfileLayout from '../components/layout/ProfileLayout/ProfileLayout';
import ProfilePage from '../features/profile/pages/ProfilePage';
import UserProfilePage from '../features/profile/pages/UserProfilePage/Userprofilepage.tsx';
import MyTemplatesPage from '../features/post/pages/MyTemplatesPage/MyTemplatesPage';
import MyGroupsPage from '../features/post/pages/MyGroupsPage/MyGroupsPage';
import GroupsFeedPage from '../features/post/pages/GroupsFeedPage';

import AdminLayout from '../components/layout/AdminLayout/AdminLayout';
import DashboardPage from '../features/admin/pages/DashboardPage';
import AdminPostsPage from '../features/admin/pages/AdminPostsPage';
import AdminUsersPage from '../features/admin/pages/AdminUsersPage';
import AdminBadgePage from '../features/admin/pages/AdminBadgePage';
import AdminTemplatesPage from '../features/admin/pages/AdminTemplatesPage';
import AdminCommentsPage from '../features/admin/pages/AdminCommentsPage';
import AdminReportsPage from '../features/admin/pages/AdminReportsPage';
import AdminAnalyticsPage from '../features/admin/pages/AdminAnalyticsPage';
import AdminSettingsPage from '../features/admin/pages/AdminSettingsPage';
import ForkEditorPage from '../features/post/pages/MyTemplatesForkPage/Forkeditorpage.tsx';
import SavedPage from '../features/saved/pages/SavedPage';
import VideoFeedPage from '../features/post/pages/VideoFeedPage';
import VideoDetailPage from '../features/post/pages/VideoDetailPage';

const router = createBrowserRouter([

    {
        element: <PublicGuard />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/register', element: <RegisterPage /> },
            { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
    },

    { path: '/oauth-success', element: <OAuth2SuccessPage /> },

    {
        element: <PrivateGuard />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { path: '/', element: <FeedPage /> },
                    { path: '/explore', element: <ExplorePage /> },
                    { path: '/following', element: <FollowingPage /> },
                    { path: '/friends', element: <Navigate to="/friends/feed" replace /> },
                    { path: '/friends/feed', element: <FriendsFeedPage /> },
                    { path: '/friends/:tab', element: <FriendsPage /> },
                    { path: '/groups', element: <Navigate to="/groups/feed" replace /> },
                    { path: '/groups/feed', element: <GroupsFeedPage /> },
                    { path: '/groups/create', element: <CreateGroupPage /> },
                    { path: '/groups/my-groups', element: <MyGroupsPage /> },
                    { path: '/groups/:id', element: <GroupDetailPage /> },
                    { path: '/notifications', element: <NotificationPage /> },
                    { path: '/hidden', element: <HiddenContentPage /> },
                    { path: '/chat', element: <ChatPage /> },
                    { path: '/feature-1', element: <MyTemplatesPage /> },
                    { path: '/saved', element: <SavedPage /> },
                    { path: '/my-violations', element: <MyViolationsPage /> },
                    { path: '/videos', element: <VideoFeedPage /> },
                    { path: '/videos/:id', element: <VideoDetailPage /> },
                ],
            },
            {
                element: <ProfileLayout />,
                children: [
                    { path: '/profile/me', element: <ProfilePage /> },
                    { path: '/profile/:userId', element: <UserProfilePage /> },
                ],
            },
            { path: '/forks/:forkId/edit', element: <ForkEditorPage /> },
        ],
    },

    {
        element: <AdminGuard />,
        children: [
            {
                element: <AdminLayout />,
                children: [
                    { path: '/admin', element: <DashboardPage /> },
                    { path: '/admin/analytics', element: <AdminAnalyticsPage /> },
                    { path: '/admin/posts', element: <AdminPostsPage /> },
                    { path: '/admin/comments', element: <AdminCommentsPage /> },
                    { path: '/admin/templates', element: <AdminTemplatesPage /> },
                    { path: '/admin/users', element: <AdminUsersPage /> },
                    { path: '/admin/badges', element: <AdminBadgePage /> },
                    { path: '/admin/reports', element: <AdminReportsPage /> },
                    { path: '/admin/settings', element: <AdminSettingsPage /> },
                ],
            },
        ],
    },

    { path: '*', element: <Navigate to="/" replace /> },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}