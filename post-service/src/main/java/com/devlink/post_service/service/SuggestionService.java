package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.CreateSuggestionRequest;
import com.devlink.post_service.dto.request.RejectSuggestionRequest;
import com.devlink.post_service.dto.request.SuggestionOverviewRequest;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.enums.SuggestionStatus;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

public interface SuggestionService {
    /**
     * User submits a suggestion to modify an existing template based on their fork content.
     * If a PENDING suggestion already exists for the same user + template, it will be overwritten (upsert).

     * Input  : templateId, forkId, suggestionType, description
     * Output : SuggestionResponse { id, templateId, userId, suggestionType, description, status=PENDING, createdAt }

     * Validation / Flow:
     * - Fork must exist and belong to current user with template ACTIVE, else throw TEMPLATE_FORK_NOT_FOUND (404)
     * - Fork must have modifications (isModified = true), else throw TEMPLATE_FORK_NO_CHANGES (400)
     * - Set fork.isProposed = true + proposedAt = now
     * - Upsert suggestion: update existing PENDING or insert new one
     */
    SuggestionResponse createSuggestion(CreateSuggestionRequest request);

    /**
     * Retrieves a paginated list of all suggestions currently awaiting admin review.
     * Only suggestions with status PENDING or REVIEWING and fork.isProposed = true are included.
     * Results are ordered by status (PENDING first, then REVIEWING) and submission time (oldest first).
     *
     * @param page zero-based page index
     * @param size number of records per page, maximum 50
     * @return Page of SuggestionSummary, empty page if no suggestions are pending
     */
    Page<SuggestionSummary> getAllPendingForAdmin(int page, int size);

    /**
     * Retrieves full details of a suggestion including the associated fork content.
     * Change the status for the person who submitted the proposal; to understand the proposal template.
     *
     * @param suggestionId the suggestion to retrieve
     * @return SuggestionDetailResponse containing suggestion info and fork content
     */
    SuggestionDetailResponse getSuggestionDetail(Long suggestionId, boolean showInfoStatus);
    /**
     * Admin approves a user's suggestion and merges the modified fork data directly into the system template.
     *
     * Input  : suggestionId
     * Output : SuggestionActionResponse { id, status=APPROVED, reviewedAt, reviewedBy }
     *
     * Validation / Flow:
     * - Suggestion must exist in DB, else throw TEMPLATE_SUGGESTION_NOT_FOUND (404)
     * - Current status must be PENDING or REVIEWING, else throw SUGGESTION_ALREADY_PROCESSED (400)
     * - System template must exist, else throw TEMPLATE_NOT_FOUND (404)
     * - Fork must exist, else throw TEMPLATE_FORK_NOT_FOUND (404)
     * - Merge data: overwrite template.Title, template.fileUrl
     * - Set suggestion.status = APPROVED, reviewedAt = now, reviewedBy = current admin ID
     * - Reset fork: isProposed = false, proposedAt = null, isModified = false
     */

    public SuggestionActionResponse approveSuggestion(Long suggestionId);
    /**
     * Admin rejects a user's suggestion with a mandatory explanatory reason without merging any data.
     *
     * Input  : suggestionId, RejectSuggestionRequest { rejectReason }
     * Output : SuggestionActionResponse { id, status=REJECTED, rejectReason, reviewedAt, reviewedBy }
     *
     * Validation / Flow:
     * - Request and rejectReason must not be blank, else handled by validation or throw REJECT_REASON_REQUIRED (400)
     * - Suggestion must exist in DB, else throw TEMPLATE_SUGGESTION_NOT_FOUND (404)
     * - Current status must be PENDING or REVIEWING, else throw SUGGESTION_ALREADY_PROCESSED (400)
     * - Fork must exist, else throw TEMPLATE_FORK_NOT_FOUND (404)
     * - Set suggestion.status = REJECTED, adminNote = rejectReason, reviewedAt = now, reviewedBy = current admin ID
     * - Unlock fork for future edits: set fork.isProposed = false, proposedAt = null (isModified remains true)
     */
    SuggestionActionResponse rejectSuggestion(Long suggestionId, RejectSuggestionRequest request);
    /**
     * User cancels and completely deletes their own PENDING/REVIEWING suggestion to protect privacy.
     *
     * Input  : suggestionId
     * Output : SuggestionActionResponse { id, status=null }
     *
     * Validation / Flow:
     * - Suggestion must exist in DB, else throw TEMPLATE_SUGGESTION_NOT_FOUND (404)
     * - Current user must be the owner of the suggestion, else throw ACCESS_DENIED (403)
     * - Status must be PENDING or REVIEWING, else throw SUGGESTION_CANNOT_CANCEL (400)
     * - Fork must exist, else throw TEMPLATE_FORK_NOT_FOUND (404)
     * - Unlock fork: set fork.isProposed = false, proposedAt = null
     * - Hard delete the suggestion record from template_suggestions table
     */
    SuggestionActionResponse cancelSuggestion(Long suggestionId);

    /**
     * Admin gets all suggestions grouped by status.
     *
     * Input  : none
     * Output : Map<String, SuggestionGroupDto>
     *key = status name (PENDING, REVIEWING, APPROVED, REJECTED, CANCELLED)
     * value = SuggestionGroupDto{ count of suggestion of this status, and value List<SuggestionSummary>}
     * Flow:
     * - Fetch all suggestions from DB
     * - Group by status into Map
     * - Status with no suggestions will not appear as key in Map
     */
    Map<String, SuggestionGroupResponse> getGroupedByStatus();

    /**
     * Admin gets paginated list of suggestions filtered by a specific status.

     * Input : status SuggestionStatus (PENDING | REVIEWING | APPROVED | REJECTED)
     * page index, 0-based
     * size page size, max 50
     * Output : Page<SuggestionSummary> { id, forkId, userId, templateId, status, createdAt }

     * Flow:
     * - Query all suggestions with matching status
     * - Return paginated result ordered by createdAt ASC
     */
    Page<SuggestionSummary> getSuggestionsByStatus(SuggestionStatus status, int page, int size);

    /**
     * Admin hard deletes a suggestion by ID.
     * Input  : suggestionId
     * Output : void
     * Flow:
     * - Suggestion must exist, else throw TEMPLATE_SUGGESTION_NOT_FOUND (404)
     * - Hard delete from DB
     */
    void deleteSuggestion(Long suggestionId);

    /**
     * Admin gets suggestion overview grouped by day and type for N periods.
     *
     * Input: SuggestionOverviewRequest { periods: [{from, to}, ...] }
     *          - Each period max 30 days
     *          - Periods must not overlap completely
     *          - Default: current date minus 1 month if not provided
     * Output: List<PeriodOverviewDto> — one entry per period
     *          each entry contains daily breakdown by SuggestionType
     *
     * Cache : Redis, TTL 24h, key = "suggestion:overview:{hash of periods}"
     */

    List<PeriodOverviewRepose> getOverviewSuggestion(SuggestionOverviewRequest request);

}
