import {SectionPlaceholder} from "../components/PagePlaceholder.tsx";
import {Activity, BookOpen, TrendingUp} from "lucide-react";


export default function AdminAnalyticsPage() {
    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Thống kê & Phân tích</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Phân tích chi tiết hoạt động người dùng và nội dung</p>
            </div>

            {/* Date range picker */}
            <SectionPlaceholder
                tag="Bộ lọc thời gian"
                title="Chọn khoảng thời gian"
                description="Date range picker: hôm nay / 7 ngày / 30 ngày / 3 tháng / tuỳ chỉnh. Nút Export PDF / Export Excel."
                height={70}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <SectionPlaceholder tag="Biểu đồ" title="Người dùng mới theo ngày" description="Line chart: số đăng ký mới mỗi ngày trong khoảng thời gian đã chọn. Tooltip chi tiết khi hover." height={240} icon={<TrendingUp size={28}/>}/>
                <SectionPlaceholder tag="Biểu đồ" title="Bài viết theo ngày" description="Bar chart: số bài đăng mới mỗi ngày. Phân chia theo postType (TEXT vs FILE) bằng màu khác nhau." height={240} icon={<TrendingUp size={28}/>}/>
                <SectionPlaceholder tag="Biểu đồ" title="Tương tác (Like & Comment)" description="Area chart chồng lên nhau: like count và comment count theo ngày." height={240} icon={<Activity size={28}/>}/>
                <SectionPlaceholder tag="Biểu đồ" title="Template theo ngôn ngữ" description="Donut chart phân bố template theo language. Click vào slice để lọc bảng bên dưới." height={240} icon={<BookOpen size={28}/>}/>
            </div>

            <div style={{ marginTop: 16 }}>
                <SectionPlaceholder
                    tag="Bảng chi tiết"
                    title="Thống kê theo từng ngôn ngữ lập trình"
                    description="Table: Language | Số template | Số user có language này | Tổng fork | Tổng view | Tỷ lệ hoàn thành fork. Sort theo cột."
                    height={200}
                />
            </div>
        </div>
    );
}