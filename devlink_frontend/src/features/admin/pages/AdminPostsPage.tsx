// src/features/admin/pages/AdminPostsPage.tsx
import {Filter, Trash2, Eye} from 'lucide-react';
import { SectionPlaceholder } from '../components/PagePlaceholder';

export default function AdminPostsPage() {
    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Quản lý bài viết</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Xem, lọc, duyệt và xoá bài viết trên hệ thống</p>
            </div>

            {/* Filter + search bar */}
            <SectionPlaceholder
                tag="Thanh lọc"
                title="Bộ lọc & Tìm kiếm"
                description="Search theo nội dung / tác giả. Filter theo: status (PENDING_REVIEW, APPROVED, FLAGGED, DELETED), postType (TEXT, FILE), visibility, khoảng ngày. Nút Export CSV."
                height={80}
                icon={<Filter size={20}/>}
            />

            <div style={{ marginTop: 16 }}>
                <SectionPlaceholder
                    tag="Bảng dữ liệu"
                    title="Danh sách bài viết"
                    description="Table với cột: ID | Tác giả | Nội dung (truncate 80 ký tự) | Loại | Trạng thái AI | Visibility | Lượt xem | Ngày đăng | Hành động (Xem, Duyệt, Xoá). Phân trang server-side. Click hàng mở modal chi tiết bài viết."
                    height={420}
                    icon={<Eye size={32}/>}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <SectionPlaceholder
                    tag="Modal chi tiết"
                    title="Xem chi tiết bài viết"
                    description="Modal hiển thị toàn bộ nội dung, media, tags, thông tin tác giả, lịch sử AI moderation, danh sách báo cáo liên quan. Các nút: Duyệt / Flag / Xoá."
                    height={200}
                    icon={<Eye size={24}/>}
                />
                <SectionPlaceholder
                    tag="Hành động hàng loạt"
                    title="Bulk actions"
                    description="Checkbox chọn nhiều bài viết → dropdown bulk action: Duyệt tất cả / Flag tất cả / Xoá tất cả. Confirm dialog trước khi thực hiện."
                    height={200}
                    icon={<Trash2 size={24}/>}
                />
            </div>
        </div>
    );
}



// ─────────────────────────────────────────────────────────────────────────────
