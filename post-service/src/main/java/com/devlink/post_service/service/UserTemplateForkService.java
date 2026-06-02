package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.UpdateForkRequest;
import com.devlink.post_service.dto.response.ForkDetailResponse;
import com.devlink.post_service.dto.response.ForkResponse;

import java.util.List;

public interface UserTemplateForkService {
    /**
     * Update current user's fork content and/or title.

     * Input: forkId, UpdateForkRequest  content, title?
     * Output: ForkResponse { forkId, templateId, title, isModified }
     *
     * <p>Validation:
     * - fork must exist → 404
     * - fork must belong to currentUser 403
     * - content must not be blank if fileType = CODE 400

     * Notes:
     * - title is optional: null = keep existing
     * - sets isModified = true, lastEditedAt = now()
     * - does NOT affect the original template
     */
    ForkResponse updateFork(Long forkId, UpdateForkRequest request);

    /**
     * Get detailed content of a fork belonging to the current user.

     * Input:  forkId
     * Output: ForkDetailResponse { id, templateId, title, content, fileUrl,
     *                              isModified, lastEditedAt, createdAt }

     * Validation:
     * - fork must exist 404
     * - fork must belong to currentUser 403

     * Notes:
     * - if content is null (PDF/DOCX/XLSX fork), reads from fileUrl via Tika
     * - fileUrl is replaced from public endpoint → internal MinIO endpoint
     *   so the container can access MinIO directly
     * - original template is not modified
     */
    ForkDetailResponse getForkDetail(Long forkId);
    /**
     * Reset a fork back to the original template content.

     * Input:  forkId
     * Output: ForkResponse { forkId, templateId, title, isModified }

     * Validation:
     * - fork must exist 404
     * - fork must belong to currentUser 403

     * Notes:
     * - copies content from original LearningTemplate.Content into fork.Content
     * - sets isModified = false, lastEditedAt = now()
     * - does NOT affect the original template
     */
     ForkResponse resetFork(Long templateId);

    /**
     * Get all forks belonging to the current user.

     * Input:  none (currentUserId from SecurityContext)
     * Output: List<ForkResponse> { forkId, templateId, title, isModified }

     * Notes:
     * - returns lightweight list, NO content/fileUrl (use getForkDetail for that)
     * - frontend uses this to build templateId  forkId map
     * - frontend can display title, isModified badge directly from this response
     * - to view full content, frontend calls getForkDetail(forkId)
     */
    List<ForkResponse> getMyForks();
}
