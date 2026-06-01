package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.CreateTemplateRequest;
import com.devlink.post_service.dto.response.PagedResponse;
import com.devlink.post_service.dto.response.TemplateCardResponse;
import com.devlink.post_service.dto.response.TemplateFileTyeAndDifficultlyResponse;
import com.devlink.post_service.dto.response.TemplateResponse;
import com.devlink.post_service.entity.enums.Difficulty;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service contract for the Learning Template module.
 *
 * <p>Defines the public API consumed by controllers.
 * Each method maps 1-to-1 with a feature in the spec (section 3.x).
 */
public interface LearningTemplateService {

    /**
     * Admin creates a new learning template by uploading a file with metadata.
     *
     * <p>Input  : CreateTemplateRequest (title, language, difficulty, fileType, file, tags, topics)
     * <p>Output : TemplateResponse with HTTP 201 — includes id, fileUrl, status=ACTIVE
     *
     * <p>Flow:
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
     *
     * Validation:
     *   - Template must exist with status ACTIVE, otherwise throws TEMPLATE_NOT_FOUND (404)
     *   - Caller must be authenticated via JWT (401 if missing)
     *
     * @param templateId    ID of the template to retrieve
     * @param currentUserId ID of the authenticated user (from JWT)
     * @return TemplateDetailResponse — includes forkInfo if user has forked, null otherwise
     */
    TemplateDetailResponse getTemplateDetail(Long templateId, Long currentUserId);
}
