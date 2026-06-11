package com.devlink.post_service.service;


import com.devlink.post_service.dto.request.CreateReportRequest;
import com.devlink.post_service.dto.request.ReportReviewRequest;
import com.devlink.post_service.dto.response.ReportResponse;

public interface ReportService {
    /**
     * Creates or updates a report against a specific target.

     * Reporter ID is resolved internally from the JWT via {@code SecurityUtils.getCurrentUserId()}.

     * First report: saves a new record with status {@code PENDING} and publishes
     * a Kafka event so user-service notifies all admins.

     * Second report with identical content (same reason + description):
     * throws {@code REPORT_ALREADY_SUBMITTED} — no further action taken.

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
     * approved = true  creates AccountRestriction + status RESOLVED.
     * approved = false records reviewNote + status REJECTED.
     * Result is cached in Redis (TTL 24h) and published to {@code report.reviewed} topic.
     *
     * @param reportId ID of the report being reviewed
     * @param req      payload containing approved, reviewNote, restrictionType, restrictionDays
     * @return {@link ReportResponse} reflecting the updated report state
     * @throws com.devlink.post_service.exception.AppException REPORT_NOT_FOUND, REPORT_ALREADY_REVIEWED
     */
    ReportResponse reviewReport(Long reportId, ReportReviewRequest req);

}
