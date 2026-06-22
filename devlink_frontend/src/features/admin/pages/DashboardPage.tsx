// src/features/admin/pages/DashboardPage.tsx
import {
    Users, FileText, BookOpen, ShieldAlert,
    MessageSquare, Eye, Activity,
} from 'lucide-react';
import { SectionPlaceholder } from '../components/PagePlaceholder';
import SuggestionOverviewChart from '../components/SuggestionOverviewChart';
import TemplateOverviewSection from '../components/TemplateOverviewSection';
import BadgeOverviewChart from '../components/BadgeOverviewChart';

interface StatCardProps {
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
}

function StatCard({ label, description, icon, color, bg }: Readonly<StatCardProps>) {
    return (
        <div style={{
            background: '#fff', borderRadius: 8,
            padding: '16px 20px',
            border: '1px solid #E5E7EB',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}>
            <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, flexShrink: 0,
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{label}</div>
                <div style={{
                    fontSize: 11, color: '#9CA3AF', marginTop: 2,
                    border: '1.5px dashed #D1D5DB',
                    borderRadius: 4, padding: '2px 6px', display: 'inline-block',
                }}>
                    {description}
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Page title */}
            <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
                    Dashboard
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                    Tổng quan toàn bộ hoạt động hệ thống DevLink
                </p>
            </div>

            {/* ── Stat cards row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <StatCard label="Tổng người dùng"    description="Hiển thị tổng số tài khoản"  icon={<Users size={20}/>}       color="#3B82F6" bg="#EFF6FF"/>
                <StatCard label="Bài viết hôm nay"   description="Số bài đăng trong 24h"        icon={<FileText size={20}/>}    color="#22C55E" bg="#F0FDF4"/>
                <StatCard label="Template học tập"   description="Tổng template đang active"    icon={<BookOpen size={20}/>}    color="#F59E0B" bg="#FFFBEB"/>
                <StatCard label="Báo cáo chờ duyệt" description="Số vi phạm chưa xử lý"        icon={<ShieldAlert size={20}/>} color="#EF4444" bg="#FEF2F2"/>
            </div>

            {/* ── Badge Overview: donut chart, click → /admin/badges?badge=... ── */}
            <BadgeOverviewChart />

            {/* ── Template Overview: stat cards + charts + items table ── */}
            <TemplateOverviewSection />

            {/* ── Main grid: chart + recent ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <SuggestionOverviewChart />
                <SectionPlaceholder
                    tag="Thống kê nhanh"
                    title="Top metrics hôm nay"
                    description="Lượt xem toàn site, bài viết đang review AI, comment mới, template được fork."
                    height={280}
                    icon={<Activity size={32}/>}
                />
            </div>

            {/* ── Bottom grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <SectionPlaceholder
                    tag="Người dùng"
                    title="Tài khoản đăng ký gần đây"
                    description="Danh sách 5-10 tài khoản đăng ký mới nhất với avatar, tên, email và ngày tạo."
                    height={220}
                    icon={<Users size={28}/>}
                />
                <SectionPlaceholder
                    tag="Nội dung"
                    title="Bài viết chờ kiểm duyệt"
                    description="Danh sách bài viết có AI moderation status = PENDING hoặc FLAGGED."
                    height={220}
                    icon={<FileText size={28}/>}
                />
                <SectionPlaceholder
                    tag="Báo cáo"
                    title="Vi phạm mới nhất"
                    description="Danh sách comment/bài viết bị báo cáo gần đây nhất."
                    height={220}
                    icon={<ShieldAlert size={28}/>}
                />
            </div>

            {/* ── Engagement row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <SectionPlaceholder
                    tag="Tương tác"
                    title="Bình luận & lượt thích theo giờ"
                    description="Biểu đồ area chart theo giờ trong ngày hôm nay."
                    height={180}
                    icon={<MessageSquare size={28}/>}
                />
                <SectionPlaceholder
                    tag="Lưu lượng"
                    title="Lượt truy cập theo nguồn"
                    description="Pie chart phân tích nguồn truy cập: trực tiếp, mạng xã hội, tìm kiếm, referral."
                    height={180}
                    icon={<Eye size={28}/>}
                />
            </div>
        </div>
    );
}