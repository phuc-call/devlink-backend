package com.devlink.post_service.repository;

import com.devlink.post_service.dto.procedure.FeedPostProcedureResult;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.entity.enums.RestrictionType;
import com.devlink.post_service.entity.enums.Visibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;  // ← đúng import

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("""
        SELECT COUNT(r) > 0 FROM AccountRestriction r
        WHERE r.userId = :userId
        AND r.restrictionType IN :types
        AND (r.restrictedUntil IS NULL OR r.restrictedUntil > :now)
    """)
    boolean existsActiveRestriction(
            @Param("userId") Long userId,
            @Param("types") List<RestrictionType> types,
            @Param("now") Instant now
    );
    // Ưu tiên view cao + random để mỗi lần reload khác nhau
    @Query("""
    SELECT p.id FROM Post p
    WHERE p.status <> 'DELETED'
    AND p.deletedAt IS NULL
    AND p.authorId NOT IN :blockedIds
    AND (
        p.visibility = 'PUBLIC'
        OR (p.visibility = 'FOLLOWERS_ONLY' AND p.authorId IN :friendIds)
        OR p.authorId = :currentUserId
    )
    AND (:postType IS NULL OR p.postType = :postType)
    ORDER BY p.createdAt DESC
""")
    Page<Long> findFeedPostIds(
            @Param("currentUserId") Long currentUserId,
            @Param("friendIds") List<Long> friendIds,
            @Param("blockedIds") List<Long> blockedIds,
            @Param("postType") PostType postType,
            Pageable pageable
    );

    @Query(value = "CALL get_feed_posts(:ids)", nativeQuery = true)
    List<FeedPostProcedureResult> callGetFeedPosts(@Param("ids") String ids);

    @Query("SELECT COUNT(p)>0 FROM Post p WHERE p.id=:id AND p.status<>:status")
    boolean existsByIdAndStatusNot(@Param("id") Long id, @Param("status") PostStatus status);

    @Query("SELECT p.authorId FROM Post p WHERE p.id = :id AND p.status <> :status")
    Optional<Long> findAuthorIdByIdAndStatusNot(@Param("id") Long id, @Param("status") PostStatus status);

    @Query("""
    SELECT new com.devlink.post_service.dto.response.FeedPostResponse(
           p.id, p.authorId, p.content, p.status, p.visibility,
           p.postType, p.viewCount, p.isPinned, p.aiModerationStatus,
           p.createdAt, p.updatedAt, p.commentCount)
    FROM Post p
    WHERE p.id IN :ids
      AND p.status <> 'DELETED'
      AND p.deletedAt IS NULL
""")
    List<FeedPostResponse> findSavedPostProjections(@Param("ids") List<Long> ids);
    @Query("""
    SELECT new com.devlink.post_service.dto.response.FeedPostResponse(
           p.id, p.authorId, p.content, p.status, p.visibility,
           p.postType, p.viewCount, p.isPinned, p.aiModerationStatus,
           p.createdAt, p.updatedAt, p.commentCount)
    FROM Post p
    WHERE p.authorId IN :followingIds
      AND p.status <> 'DELETED'
      AND p.deletedAt IS NULL
    ORDER BY p.createdAt DESC
""")
    Page<FeedPostResponse> findFollowingPosts(
            @Param("followingIds") List<Long> followingIds,
            Pageable pageable
    );

    @Query("""
    SELECT new com.devlink.post_service.dto.response.FeedPostResponse(
           p.id, p.authorId, p.content, p.status, p.visibility,
           p.postType, p.viewCount, p.isPinned, p.aiModerationStatus,
           p.createdAt, p.updatedAt, p.commentCount)
    FROM Post p
    WHERE p.authorId = :authorId
      AND p.visibility IN :visibilities
      AND p.status <> 'DELETED'
      AND p.deletedAt IS NULL
    ORDER BY p.createdAt DESC
""")
    Page<FeedPostResponse> findPostsByAuthorIdAndVisibilityIn(
            @Param("authorId") Long authorId,
            @Param("visibilities") List<Visibility> visibilities,
            Pageable pageable
    );


}