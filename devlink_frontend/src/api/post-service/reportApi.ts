// src/api/post-service/reportApi.ts

import axiosInstance from '../axiosInstance';
import type {
    CreateReportRequest,
    ReportResponse,
    ReportReviewRequest,
    ReportPageResponse,
    ReportDetailResponse,
    MyViolationResponse,
    ReportTargetType,
    ReportStatus,
    
} from '../../types/report.types';

const BASE_URL = '/api/posts/reports';

export const reportApi = {

    // ── Người dùng ─────────────────────────────────────────────────────

    /**
     * Tạo mới hoặc cập nhật báo cáo.
     * POST /api/posts/reports
     */
    report(req: CreateReportRequest) {
        return axiosInstance.post<{ data: ReportResponse }>(BASE_URL, req);
    },

    /**
     * Xem chi tiết báo cáo mình đã gửi (gắn với notification).
     * GET /api/posts/reports/notif-detail?notificationId={id}
     *
     * Chỉ người tố cáo mới được xem. Backend lấy payload từ Redis,
     * trả về nội dung bị báo cáo (snapshot hoặc live).
     */
    getReportDetail(notificationId: number) {
        return axiosInstance.get<{ data: ReportDetailResponse }>(
            `${BASE_URL}/notif-detail`,
            { params: { notificationId } }
        );
    },

    /**
     * Xem danh sách vi phạm của chính mình.
     * GET /api/posts/reports/my-violations
     *
     * Trả về tất cả AccountRestriction của user hiện tại,
     * kèm snapshot nội dung bị xóa (nếu Redis chưa hết TTL 7 ngày).
     */
    getMyViolations() {
        return axiosInstance.get<{ data: MyViolationResponse[] }>(
            `${BASE_URL}/my-violations`
        );
    },

    // ── Admin ──────────────────────────────────────────────────────────

    /**
     * Lấy danh sách báo cáo (phân trang, lọc theo loại và trạng thái).
     * GET /api/posts/reports/admin?targetType=POST&status=PENDING&page=0&size=20
     *
     * @param targetType POST | COMMENT | COMMENT_REPLY
     * @param status     PENDING | RESOLVED | REJECTED | undefined (= tất cả)
     * @param page       zero-based
     * @param size       tối đa 20
     */
    getReports(
        targetType: ReportTargetType,
        status: ReportStatus | undefined,
        page: number,
        size: number
    ) {
        return axiosInstance.get<{ data: ReportPageResponse }>(
            `${BASE_URL}/admin`,
            {
                params: {
                    targetType,
                    ...(status !== undefined ? { status } : {}),
                    page,
                    size,
                },
            }
        );
    },

    /**
     * Admin xử lý (duyệt / từ chối) một báo cáo.
     * PUT /api/posts/reports/admin/{reportId}/review
     *
     * approved = true  → xóa nội dung + tạo AccountRestriction
     * approved = false → đánh dấu REJECTED + notify người tố cáo
     * permanent = true → hạn chế vĩnh viễn (chỉ khi approved = true)
     */
    reviewReport(reportId: number, req: ReportReviewRequest) {
        return axiosInstance.put<{ data: ReportResponse }>(
            `${BASE_URL}/admin/${reportId}/review`,
            req
        );
    },

    /**
     * Admin xóa báo cáo đã RESOLVED hoặc REJECTED.
     * DELETE /api/posts/reports/admin/{reportId}
     *
     * Lưu ý: báo cáo PENDING không xóa được (backend trả REPORT_CANNOT_DELETE).
     */
    deleteReport(reportId: number) {
        return axiosInstance.delete<{ data: null }>(
            `${BASE_URL}/admin/${reportId}`
        );
    },

 
};