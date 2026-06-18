package com.devlink.post_service.service;


import com.devlink.post_service.dto.request.CreateReportRequest;
import com.devlink.post_service.dto.request.ReportReviewRequest;
import com.devlink.post_service.dto.response.MyViolationResponse;
import com.devlink.post_service.dto.response.ReportDetailResponse;
import com.devlink.post_service.dto.response.ReportPageResponse;
import com.devlink.post_service.dto.response.ReportResponse;
import com.devlink.post_service.entity.enums.ReportStatus;
import com.devlink.post_service.entity.enums.TargetType;

import java.util.List;

public interface ReportService {
    /**
     * Creates or updates a report against a specific target.
     * <p>
     * Reporter ID is resolved internally from the JWT via {@code SecurityUtils.getCurrentUserId()}.
     * <p>
     * First report: saves a new record with status {@code PENDING} and publishes
     * a Kafka event so user-service notifies all admins.
     * <p>
     * Second report with identical content (same reason + description):
     * throws {@code REPORT_ALREADY_SUBMITTED} — no further action taken.
     * <p>
     * Second report with different content: updates reason/description,
     * resets status to {@code PENDING}, clears AI fields, and re-publishes the event.
     *
     * @param req payload containing targetId, targetType, reason, description
     * @return {@link ReportResponse} reflecting the saved or updated report
     * @throws com.devlink.post_service.exception.AppException
     */
    ReportResponse createOrUpdateReport(CreateReportRequest req);


    /**
     * Processes an admin decision on a pending report.
     * approved = true  -> xóa content vi phạm khỏi DB + snapshot Redis 7 ngày
     * + tạo AccountRestriction (1 tuần hoặc vĩnh viễn).
     * approved = false -> notify reporter người này không vi phạm.
     * Kết quả publish lên {@code report.reviewed} Kafka topic.
     *
     * @param reportId ID of the report being reviewed
     * @param req      payload containing approved, reviewNote, permanent
     * @return {@link ReportResponse} reflecting the updated report state
     * @throws AppException REPORT_NOT_FOUND, REPORT_ALREADY_REVIEWED
     */
    ReportResponse reviewReport(Long reportId, ReportReviewRequest req);


    /**
     * Returns a paginated list of reports for admin review.
     * Supports filtering by targetType and status.
     * Reporter and violator names are enriched from user-service via batch cache-aside call.
     *
     * @param targetType type of reported content (POST, COMMENT, COMMENT_REPLY)
     * @param status report status filter, null = all statuses
     * @param page zero-based page index
     * @param size page size, capped at 20
     */
    ReportPageResponse getReports(TargetType targetType, ReportStatus status, int page, int size);

    /**
     * Deletes a report that is not in PENDING status.
     * Only RESOLVED or REJECTED reports can be removed.
     *
     * @param reportId ID of the report to delete
     * @throws AppException REPORT_NOT_FOUND, REPORT_CANNOT_DELETE if status is PENDING
     */
    void deleteReport(Long reportId);

    /**
     * Returns all account restrictions for the current user with deleted content snapshots from Redis.
     * Snapshot may be null if Redis TTL (7 days) has expired.
     */
    List<MyViolationResponse> getMyViolations();

    /**
     * Returns report detail for the current reporter by notificationId (Redis key report:notification:{id}).
     * Throws FORBIDDEN if caller is not the original reporter, REPORT_NOT_FOUND if Redis key missing.
     *
     * @param notificationId notification DB id used as Redis key
     */
    ReportDetailResponse getReportDetail(Long notificationId);
}
