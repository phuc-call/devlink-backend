// src/components/layout/AdminLayout/AdminLayout.tsx
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { userProfileApi } from '../../../api/user-service/userProfileApi';
import type { UserProfileResponse } from '../../../types/profile.types';
import {
    LayoutDashboard,
    Users,
    FileText,
    BookOpen,
    MessageSquare,
    ShieldAlert,
    Award,
    BarChart2,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Bell,
    Sliders,
    Tag,
    UserPlus,
} from 'lucide-react';


interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: number;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
    {
        title: 'Tổng quan',
        items: [
            { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={16} /> },
            { label: 'Thống kê', path: '/admin/analytics', icon: <BarChart2 size={16} /> },
        ],
    },
    {
        title: 'Quản lý nội dung',
        items: [
            { label: 'Bài viết', path: '/admin/posts', icon: <FileText size={16} /> },
            { label: 'Bình luận', path: '/admin/comments', icon: <MessageSquare size={16} /> },
            { label: 'Template học tập', path: '/admin/templates', icon: <BookOpen size={16} /> },
        ],
    },
    {
        title: 'Quản lý người dùng',
        items: [
            { label: 'Tài khoản', path: '/admin/users', icon: <Users size={16} /> },
            { label: 'Hồ sơ & Sở thích', path: '/admin/users/interests', icon: <UserPlus size={16} /> },
            { label: 'Badge', path: '/admin/badges', icon: <Award size={16} /> },
            { label: 'Báo cáo / Vi phạm', path: '/admin/reports', icon: <ShieldAlert size={16} /> },
        ],
    },
    {
        title: 'Hệ thống',
        items: [
            { label: 'Tham số hệ thống', path: '/admin/tag-groups', icon: <Tag size={16} /> },
            { label: 'Cài đặt', path: '/admin/settings', icon: <Settings size={16} /> },
        ],
    },
];


export default function AdminLayout() {
    const [isMobile, setIsMobile] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<UserProfileResponse | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        userProfileApi.getProfile()
            .then(res => setUser(res.data.data))
            .catch(() => setUser(null));
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 992;
            setIsMobile(mobile);
            if (mobile) setCollapsed(true);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        navigate('/login', { replace: true });
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            background: '#F0F2F5',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden',
            position: 'relative',
        }}>

            {/* ── Overlay for mobile ── */}
            {isMobile && !collapsed && (
                <div
                    onClick={() => setCollapsed(true)}
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 40,
                    }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                width: collapsed ? (isMobile ? 0 : 64) : 260,
                minWidth: collapsed ? (isMobile ? 0 : 64) : 260,
                maxWidth: collapsed ? (isMobile ? 0 : 64) : 260,
                position: isMobile ? 'absolute' : 'relative',
                zIndex: 50,
                height: '100%',
                background: '#111827',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
                overflow: 'visible',
            }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: (isMobile && collapsed) ? 0 : 1, transition: 'opacity 0.2s' }}>

                    {/* Logo */}
                    <div style={{
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        padding: collapsed ? '0 16px' : '0 20px',
                        borderBottom: '1px solid #1F2937',
                        gap: 10,
                        flexShrink: 0,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                    }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: '#3B82F6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>D</span>
                        </div>
                        {!collapsed && (
                            <div>
                                <div style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>DevLink</div>
                                <div style={{ color: '#6B7280', fontSize: 11 }}>Admin Panel</div>
                            </div>
                        )}
                    </div>

                    {/* Nav */}
                    <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
                        {NAV_GROUPS.map(group => (
                            <div key={group.title} style={{ marginBottom: 4 }}>
                                {!collapsed && (
                                    <div style={{
                                        padding: '6px 20px 4px',
                                        fontSize: 10, fontWeight: 600,
                                        color: '#4B5563',
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                    }}>
                                        {group.title}
                                    </div>
                                )}
                                {group.items.map(item => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === '/admin' || item.path === '/admin/users'}
                                        style={({ isActive }) => ({
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: collapsed ? '10px 0' : '9px 20px',
                                            justifyContent: collapsed ? 'center' : 'flex-start',
                                            color: isActive ? '#3B82F6' : '#9CA3AF',
                                            background: isActive ? '#1F2937' : 'transparent',
                                            borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
                                            textDecoration: 'none',
                                            fontSize: 13,
                                            fontWeight: isActive ? 600 : 400,
                                            transition: 'all 0.12s',
                                            cursor: 'pointer',
                                        })}
                                    >
                                        <span style={{ flexShrink: 0 }}>{item.icon}</span>
                                        {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                                        {!collapsed && item.badge !== undefined && item.badge > 0 && (
                                            <span style={{
                                                background: '#EF4444', color: '#fff',
                                                fontSize: 10, fontWeight: 700,
                                                padding: '1px 6px', borderRadius: 9999,
                                            }}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div style={{ padding: '12px 0', borderTop: '1px solid #1F2937', flexShrink: 0 }}>
                        <button
                            type="button"
                            onClick={handleLogout}
                            style={{
                                display: 'flex', alignItems: 'center',
                                gap: 10, width: '100%',
                                padding: collapsed ? '10px 0' : '9px 20px',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                background: 'none', border: 'none',
                                color: '#EF4444', fontSize: 13,
                                cursor: 'pointer',
                                transition: 'background 0.12s',
                            }}
                        >
                            <LogOut size={16} />
                            {!collapsed && <span>Đăng xuất</span>}
                        </button>
                    </div>

                    {/* Collapse toggle */}
                    {!isMobile && (
                        <button
                            type="button"
                            onClick={() => setCollapsed(v => !v)}
                            style={{
                                position: 'absolute', right: -12, top: '50%',
                                transform: 'translateY(-50%)',
                                width: 24, height: 24, borderRadius: '50%',
                                background: '#3B82F6', border: '2px solid #111827',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#fff', zIndex: 10,
                                flexShrink: 0,
                            }}
                        >
                            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                        </button>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

                {/* Header bar */}
                <header style={{
                    height: 60, background: '#fff',
                    borderBottom: '1px solid #E5E7EB',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px', flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isMobile && (
                            <button
                                onClick={() => setCollapsed(false)}
                                style={{
                                    background: 'none', border: 'none', padding: 0,
                                    display: 'flex', alignItems: 'center', cursor: 'pointer',
                                    color: '#374151'
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                            </button>
                        )}
                        <div style={{ fontSize: 14, color: '#6B7280' }}>
                            Admin Panel — <span style={{ color: '#111827', fontWeight: 500 }}>DevLink</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button type="button" style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: '#F3F4F6', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#6B7280',
                        }}>
                            <Bell size={16} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: '#3B82F6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: 13,
                                overflow: 'hidden'
                            }}>
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    user?.fullName ? user.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : 'A'
                                )}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: isMobile ? 'none' : 'block' }}>
                                {user?.fullName || 'Admin'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}