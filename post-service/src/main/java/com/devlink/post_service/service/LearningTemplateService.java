package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.CreateTemplateRequest;
import com.devlink.post_service.dto.response.TemplateResponse;
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
}
