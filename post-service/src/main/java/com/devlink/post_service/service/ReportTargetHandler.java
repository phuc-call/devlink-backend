package com.devlink.post_service.service;

import com.devlink.post_service.entity.enums.RestrictionType;
import com.devlink.post_service.entity.enums.TargetType;

public interface ReportTargetHandler {
    /**
     * Gets the specific target type that this handler is responsible for.
     *
     * @return the corresponding {@link TargetType} (e.g., POST, COMMENT)
     */
    TargetType getType();
    /**
     * Checks whether the target content exists in the database.
     *
     * @param targetId the unique identifier of the target content
     * @return true if the content exists, false otherwise
     */
    boolean exists(Long targetId);

    /**
     * Retrieves the author ID of the target content to ensure the penalty
     * is applied to the correct user.
     *
     * @param targetId the unique identifier of the target content
     * @return the user ID of the content creator
     */
    Long getAuthorId(Long targetId);

    /**
     * Resolves the specific type of account restriction to apply when this
     * target content violates community guidelines.
     *
     * @return the corresponding {@link RestrictionType} (e.g., POST_BAN, COMMENT_BAN)
     */
    RestrictionType getRestrictionType();

    /**
     * Provides the key prefix format used for identifying and caching
     * the deleted content snapshot in Redis (e.g., "post", "comment", "reply").
     *
     * @return the string token used for Redis key construction
     */
    String getSnapshotKey();

    /**
     * Performs a cascading clean-up by deleting the target content and all of its
     * related database dependencies to eliminate orphan records, while returning
     * the state of the original entity for Redis snapshot backup.
     *
     * @param targetId the unique identifier of the target content to be removed
     * @return the deleted entity object to be serialized and backed up in Redis
     */
    Object deleteAndGetSnapshot(Long targetId);

    Object getSnapshot(Long targetId);
}
