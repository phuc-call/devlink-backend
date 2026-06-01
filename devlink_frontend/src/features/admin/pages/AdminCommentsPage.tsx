// src/features/admin/pages/AdminCommentsPage.tsx
import {SectionPlaceholder} from "../components/PagePlaceholder.tsx";
import {MessageSquare} from "lucide-react";

export default function AdminCommentsPage() {
    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Quản lý bình luận</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Kiểm duyệt và xoá bình luận vi phạm</p>
            </div>

            <SectionPlaceholder
                tag="Thanh lọc"
                title="Lọc bình luận"
                description="Search theo nội dung / tên người dùng. Filter theo: status (VISIBLE, HIDDEN, FLAGGED), loại (COMMENT/REPLY), khoảng ngày, có báo cáo hay không."
                height={80}
            />

            <div style={{ marginTop: 16 }}>
                <SectionPlaceholder
                    tag="Bảng dữ liệu"
                    title="Danh sách bình luận"
                    description="Table: ID | Tác giả | Nội dung (80 ký tự) | Bài viết thuộc về | Loại (COMMENT/REPLY) | Số báo cáo | Ngày tạo | Hành động (Xem ngữ cảnh, Ẩn, Xoá vĩnh viễn). Highlight màu đỏ nếu có báo cáo."
                    height={400}
                    icon={<MessageSquare size={32}/>}
                />
            </div>

            <div style={{ marginTop: 16 }}>
                <SectionPlaceholder
                    tag="Modal ngữ cảnh"
                    title="Xem bình luận trong ngữ cảnh bài viết"
                    description="Modal hiển thị bài viết gốc + thread bình luận, highlight comment đang xét. Admin có thể Ẩn / Xoá ngay từ modal này."
                    height={160}
                />
            </div>
        </div>
    );
}
