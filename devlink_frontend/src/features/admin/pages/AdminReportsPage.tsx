import {SectionPlaceholder} from "../components/PagePlaceholder.tsx";
import {Flag, ShieldAlert} from "lucide-react";

export default function AdminReportsPage() {
    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Báo cáo & Vi phạm</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Xử lý báo cáo từ người dùng về bài viết và bình luận</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                <SectionPlaceholder tag="Thống kê" title="Báo cáo chờ xử lý" description="Số báo cáo có status PENDING" height={90} icon={<ShieldAlert size={20}/>}/>
                <SectionPlaceholder tag="Thống kê" title="Xử lý hôm nay" description="Số báo cáo đã RESOLVED trong 24h" height={90}/>
                <SectionPlaceholder tag="Thống kê" title="Tỷ lệ xử lý" description="% báo cáo được giải quyết trong 24h" height={90}/>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <SectionPlaceholder
                    tag="Danh sách báo cáo"
                    title="Báo cáo bài viết / bình luận"
                    description="Table: Loại (POST/COMMENT) | Nội dung bị báo cáo | Lý do | Người báo cáo | Số lần bị báo | Status (PENDING/REVIEWING/RESOLVED/DISMISSED) | Ngày | Hành động (Xem, Giải quyết, Bỏ qua). Filter theo loại và status."
                    height={380}
                    icon={<Flag size={32}/>}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <SectionPlaceholder
                        tag="Panel xử lý"
                        title="Chi tiết & Hành động"
                        description="Hiển thị chi tiết nội dung bị báo cáo, lý do, lịch sử báo cáo của tác giả. Các nút: Xoá nội dung, Khoá tài khoản tác giả, Đánh dấu không vi phạm."
                        height={180}
                        icon={<ShieldAlert size={24}/>}
                    />
                    <SectionPlaceholder
                        tag="Thống kê vi phạm"
                        title="Top người dùng vi phạm"
                        description="Danh sách 5 tài khoản bị báo cáo nhiều nhất tháng này, kèm số lần vi phạm."
                        height={180}
                    />
                </div>
            </div>
        </div>
    );
}
