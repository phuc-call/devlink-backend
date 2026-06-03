package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.CreateTemplateRequest;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.enums.Difficulty;
import com.devlink.post_service.entity.enums.TemplateStatus;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service contract for the Learning Template module.

 *Defines the public API consumed by controllers.
 * Each method maps 1-to-1 with a feature in the spec (section 3.x).
 */
public interface LearningTemplateService {

    /**
     * Admin creates a new learning template by uploading a file with metadata.

     * Input  : CreateTemplateRequest (title, language, difficulty, fileType, file, tags, topics)
     * Output : TemplateResponse with HTTP 201 — includes id, fileUrl, status=ACTIVE

     * Flow:
     *   1. Validate role ADMIN, file size ≤ 100MB, language from user-service, fileType match
     *   2. Upload file to MinIO storage → get fileUrl
     *   3. Save LearningTemplate with status = ACTIVE
     *   4. Async: extract text (PDF/DOCX) generate AI summary update DB
     *
     * @param request   validated request body from controller

     * @return TemplateResponse
     */
    TemplateResponse createTemplate(CreateTemplateRequest request, MultipartFile file);

     TemplateFileTyeAndDifficultlyResponse getFileTypeAndDifficulty();

     PagedResponse<TemplateCardResponse> getMyTemplates( int page, int size,
                                                              Difficulty difficulty, String tag);

    public PagedResponse<TemplateCardResponse> getTemplates(int page, int size,
                                                              Difficulty difficulty, String tag);
    /**
     * Get full detail of a learning template.
     * Increments view count via DB trigger. Includes fork info if the user has forked this template.

     * Validation:
     *   - Template must exist with status ACTIVE, otherwise throws TEMPLATE_NOT_FOUND (404)
     *   - Caller must be authenticated via JWT (401 if missing)
     *
     * @param templateId    ID of the template to retrieve
     * @return TemplateDetailResponse — includes forkInfo if user has forked, null otherwise
     */
     TemplateDetailResponse getTemplateDetail(Long templateId);

    /**
     * Fork a template for the current user.

     * Input: templateId
     * Output: ForkResponse { forkId, templateId, title, isModified }

     * Validation:
     * - Template must exist and status = ACTIVE  404
     * - fileType = VIDEO → 400 (fork not allowed)

     * Notes:
     * - If already forked → return existing fork (no duplicate)
     * - CODE: copies content text into fork
     * - PDF/DOCX/XLSX: stores original fileUrl, content = null
     * - forkCount on original template incremented by 1
     */
    ForkResponse forkTemplate(Long templateId);

    /**
     * Change the status of specific learning template
     *This method validation the state transition rules before updating the template status
     * @param templateId the unique ID of the template to be updated
     * @param newStatus the new status to apply (ACTIVE, HIDDEN, or DELETE)
     * @throws com.devlink.post_service.exception.AppException if the template is not found or the state transition is invalid
     */
     void updateTemplateStatus(Long templateId, TemplateStatus newStatus);

}
