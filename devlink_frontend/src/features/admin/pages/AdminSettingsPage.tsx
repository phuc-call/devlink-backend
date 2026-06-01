// src/features/admin/pages/AdminSettingsPage.tsx

import {SectionPlaceholder} from "../components/PagePlaceholder.tsx";

export default function AdminSettingsPage() {
    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Cài đặt hệ thống</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Cấu hình các thông số vận hành của DevLink</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <SectionPlaceholder
                    tag="AI Moderation"
                    title="Cấu hình kiểm duyệt AI"
                    description="Toggle bật/tắt AI auto-moderation. Chọn độ nhạy (LOW/MEDIUM/HIGH). Danh sách từ khoá bị cấm. Ngưỡng điểm vi phạm để auto-flag."
                    height={200}
                />
                <SectionPlaceholder
                    tag="File upload"
                    title="Giới hạn upload"
                    description="Cấu hình: max file size (hiện tại 50MB), max file/post (hiện tại 10), các định dạng được phép, tổng dung lượng tối đa mỗi bài."
                    height={200}
                />
                <SectionPlaceholder
                    tag="Template"
                    title="Danh sách ngôn ngữ hỗ trợ"
                    description="Quản lý whitelist ngôn ngữ cho Learning Template: thêm/xoá ngôn ngữ, cập nhật tên hiển thị và icon."
                    height={200}
                />
                <SectionPlaceholder
                    tag="Thông báo"
                    title="Cấu hình thông báo hệ thống"
                    description="Quản lý template email/notification gửi cho user: chào mừng, xác minh, cảnh báo vi phạm, suggestion được duyệt."
                    height={200}
                />
            </div>

            <div style={{ marginTop: 16 }}>
                <SectionPlaceholder
                    tag="Nguy hiểm"
                    title="Vùng nguy hiểm"
                    description="Các hành động không thể hoàn tác: Xoá toàn bộ post đã DELETED, Xoá cache Redis, Reset AI moderation queue. Yêu cầu nhập mật khẩu xác nhận."
                    height={120}
                />
            </div>
        </div>
    );
}