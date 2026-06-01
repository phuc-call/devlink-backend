
// src/features/admin/pages/AdminUsersPage.tsx
import { UserCheck, UserX, Users } from 'lucide-react';
import {SectionPlaceholder} from "../components/PagePlaceholder.tsx";

export default function AdminUsersPage() {
    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Quản lý tài khoản</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Xem, khoá, phân quyền và quản lý tất cả tài khoản người dùng</p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                <SectionPlaceholder tag="Số liệu" title="Tổng tài khoản" description="Đếm tổng: ACTIVE / BANNED / PENDING_VERIFY" height={100} icon={<Users size={20}/>}/>
                <SectionPlaceholder tag="Số liệu" title="Đăng ký hôm nay" description="Số tài khoản mới trong 24h" height={100} icon={<UserCheck size={20}/>}/>
                <SectionPlaceholder tag="Số liệu" title="Tài khoản bị khoá" description="Tổng số account có restriction đang active" height={100} icon={<UserX size={20}/>}/>
            </div>

            <SectionPlaceholder
                tag="Thanh lọc"
                title="Tìm kiếm & Lọc người dùng"
                description="Search theo tên / email / userId. Filter theo: role (USER, ADMIN), status (ACTIVE, BANNED, UNVERIFIED), có badge hay không, khoảng ngày đăng ký."
                height={80}
            />

            <div style={{ marginTop: 16 }}>
                <SectionPlaceholder
                    tag="Bảng dữ liệu"
                    title="Danh sách người dùng"
                    description="Table: Avatar | Tên | Email | Role | Status | Badge | Ngày tạo | Số bài viết | Hành động (Xem profile, Khoá tài khoản, Đổi role). Click hàng → mở drawer chi tiết user."
                    height={380}
                    icon={<Users size={32}/>}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <SectionPlaceholder
                    tag="Drawer chi tiết"
                    title="Thông tin chi tiết user"
                    description="Panel bên phải: avatar, thông tin cơ bản, ngôn ngữ lập trình, lịch sử restriction, danh sách bài viết gần nhất, nút Khoá / Mở khoá / Cấp badge."
                    height={200}
                />
                <SectionPlaceholder
                    tag="Restriction"
                    title="Thêm / Xoá hạn chế tài khoản"
                    description="Modal tạo restriction: chọn loại (POST_BAN, FULL_BAN, COMMENT_BAN), nhập lý do, chọn thời hạn hoặc vĩnh viễn. Lịch sử restriction hiện tại."
                    height={200}
                    icon={<UserX size={24}/>}
                />
            </div>
        </div>
    );
}
