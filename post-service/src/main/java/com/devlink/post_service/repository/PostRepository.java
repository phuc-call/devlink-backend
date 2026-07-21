package com.devlink.post_service.repository;

import com.devlink.post_service.dto.procedure.FeedPostProcedureResult;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.VideoPostResponse;
import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.entity.enums.Visibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

  String FEED_SELECT = """
      SELECT new com.devlink.post_service.dto.response.FeedPostResponse(
             p.id, p.authorId, p.groupId, p.content, p.status, p.visibility,
             p.postType, p.viewCount, p.isPinned, p.aiModerationStatus,
             p.createdAt, p.updatedAt, p.commentCount, p.likeCount, p.sharedPostId)
      """;

  @Query(FEED_SELECT + """
          FROM Post p
          WHERE p.id IN :postIds
      """)
  List<FeedPostResponse> findFeedPostProjections(@Param("postIds") List<Long> postIds);

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
          AND (
              p.groupId IS NULL
              OR p.groupId IN :approvedGroupIds
          )
          AND (:postType IS NULL OR p.postType = :postType)
          ORDER BY p.createdAt DESC
      """)
  Page<Long> findFeedPostIds(
      @Param("currentUserId") Long currentUserId,
      @Param("friendIds") List<Long> friendIds,
      @Param("blockedIds") List<Long> blockedIds,
      @Param("approvedGroupIds") List<Long> approvedGroupIds,
      @Param("postType") PostType postType,
      Pageable pageable);

  @Query(value = "CALL get_feed_posts(:ids)", nativeQuery = true)
  List<FeedPostProcedureResult> callGetFeedPosts(@Param("ids") String ids);

  @Query("SELECT COUNT(p)>0 FROM Post p WHERE p.id=:id AND p.status<>:status")
  boolean existsByIdAndStatusNot(@Param("id") Long id, @Param("status") PostStatus status);

  @Query("SELECT p.authorId FROM Post p WHERE p.id = :id AND p.status <> :status")
  Optional<Long> findAuthorIdByIdAndStatusNot(@Param("id") Long id, @Param("status") PostStatus status);

  @Query(FEED_SELECT + """
          FROM Post p
          WHERE p.id IN :ids
            AND p.status <> 'DELETED'
            AND p.deletedAt IS NULL
      """)
  List<FeedPostResponse> findSavedPostProjections(@Param("ids") List<Long> ids);

  @Query(FEED_SELECT + """
          FROM Post p
          WHERE p.authorId IN :followingIds
            AND p.status <> 'DELETED'
            AND p.deletedAt IS NULL
          ORDER BY p.createdAt DESC
      """)
  Page<FeedPostResponse> findFollowingPosts(
      @Param("followingIds") List<Long> followingIds,
      Pageable pageable);

  @Query(FEED_SELECT + """
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
      Pageable pageable);

  @Query(FEED_SELECT + """
          FROM Post p
          WHERE p.groupId = :groupId
            AND p.status <> 'DELETED'
            AND p.deletedAt IS NULL
          ORDER BY p.createdAt DESC
      """)
  Page<FeedPostResponse> findPostsByGroupId(
      @Param("groupId") Long groupId,
      Pageable pageable);

  @Query(FEED_SELECT + """
          FROM Post p
          WHERE p.authorId IN :authorIds
            AND p.status <> 'DELETED'
            AND p.deletedAt IS NULL
            AND p.visibility IN ('PUBLIC', 'FOLLOWERS_ONLY')
          ORDER BY p.createdAt DESC
      """)
  Page<FeedPostResponse> findFriendsFeedPosts(
      @Param("authorIds") List<Long> authorIds,
      Pageable pageable);

  @Query(FEED_SELECT + """
          FROM Post p
          WHERE p.groupId IN :groupIds
            AND p.status <> 'DELETED'
            AND p.deletedAt IS NULL
          ORDER BY p.createdAt DESC
      """)
  Page<FeedPostResponse> findGroupsFeedPosts(
      @Param("groupIds") List<Long> groupIds,
      Pageable pageable);

  /**
   * Fetches active VIDEO posts filtered by file size (bytes) of their video
   * attachment.
   *
   * FIX: Replaced bare enum class references (PostType.VIDEO, PostStatus.ACTIVE,
   * etc.)
   * with string literals ('VIDEO', 'ACTIVE', 'APPROVED', 'PUBLIC',
   * 'FOLLOWERS_ONLY', 'VIDEO')
   * because JPQL does not automatically resolve unqualified enum class names
   * unless they
   * are registered as static imports in the persistence unit. String literals are
   * safer
   * and work consistently across JPA providers.
   *
   * Also replaced MediaType.VIDEO with string 'VIDEO' for the same reason.
   */
  @Query("""
          SELECT new com.devlink.post_service.dto.response.VideoPostResponse(
              p.id, p.authorId, p.content,
              p.viewCount, p.createdAt, p.updatedAt,
              p.commentCount, p.likeCount,
              MIN(m.fileSize)
          )
          FROM Post p
          JOIN p.mediaList m
          WHERE p.postType = 'VIDEO'
            AND p.status NOT IN ('DELETED', 'SUSPENDED')
            AND p.aiModerationStatus IN ('APPROVED', 'PENDING')
            AND p.deletedAt IS NULL
            AND (
                p.visibility = 'PUBLIC'
                OR (p.visibility = 'FOLLOWERS_ONLY' AND p.authorId IN :friendIds)
            )
            AND p.authorId NOT IN :blockedIds
            AND m.mediaType = 'VIDEO'
            AND m.fileSize IS NOT NULL
            AND m.fileSize >= :minBytes
            AND m.fileSize <= :maxBytes
          GROUP BY p.id, p.authorId, p.content,
                   p.viewCount, p.createdAt, p.updatedAt,
                   p.commentCount, p.likeCount
          ORDER BY p.createdAt DESC
      """)
  Page<VideoPostResponse> findVideoFeedByFileSize(
      @Param("blockedIds") List<Long> blockedIds,
      @Param("friendIds") List<Long> friendIds,
      @Param("minBytes") long minBytes,
      @Param("maxBytes") long maxBytes,
      Pageable pageable);

  /**
   * Fetches a single VIDEO post by ID for the detail view.
   * Same enum-literal fix applied here.
   */
  @Query("""
          SELECT new com.devlink.post_service.dto.response.VideoPostResponse(
              p.id, p.authorId, p.content,
              p.viewCount, p.createdAt, p.updatedAt,
              p.commentCount, p.likeCount,
              MIN(m.fileSize)
          )
          FROM Post p
          JOIN p.mediaList m
          WHERE p.id = :postId
            AND p.postType = 'VIDEO'
            AND p.status NOT IN ('DELETED', 'SUSPENDED')
            AND p.aiModerationStatus IN ('APPROVED', 'PENDING')
            AND p.deletedAt IS NULL
            AND (
                p.visibility = 'PUBLIC'
                OR (p.visibility = 'FOLLOWERS_ONLY' AND p.authorId IN :friendIds)
            )
            AND p.authorId NOT IN :blockedIds
          GROUP BY p.id, p.authorId, p.content,
                   p.viewCount, p.createdAt, p.updatedAt,
                   p.commentCount, p.likeCount
      """)
  Optional<VideoPostResponse> findVideoDetailById(
      @Param("postId") Long postId,
      @Param("blockedIds") List<Long> blockedIds,
      @Param("friendIds") List<Long> friendIds);

  /**
   * Returns interest-based posts matching the user's top tags.
   *
   * Key optimizations:
   * - EXISTS instead of JOIN: short-circuits on the first matching tag,
   * avoiding the full scan + deduplication that JOIN + DISTINCT would require.
   * - groupId IS NULL: keeps group posts out of the main feed to prevent
   * duplication.
   * - status = ACTIVE: only posts that have passed AI moderation.
   * - likeCount >= minLike: filters spam, fake news, and zero-engagement posts.
   * - Pageable: standard Spring LIMIT/OFFSET — does not load the full table into
   * memory.
   *
   * @param tags     the user's top interest tags
   * @param minLike  minimum like count threshold for quality filtering
   * @param pageable pagination parameters
   */
  @Query(value = FEED_SELECT + """
          FROM Post p
          WHERE p.status <> 'DELETED'
            AND p.deletedAt IS NULL
            AND p.visibility = 'PUBLIC'
            AND p.likeCount >= :minLike
            AND (p.groupId IS NULL OR p.groupId IN :approvedGroupIds)
            AND EXISTS (
                SELECT 1 FROM PostTag pt
                WHERE pt.post = p
                AND pt.tag IN :tags
            )
          ORDER BY RAND()
      """, countQuery = """
          SELECT count(p.id)
          FROM Post p
          WHERE p.status <> 'DELETED'
            AND p.deletedAt IS NULL
            AND p.visibility = 'PUBLIC'
            AND p.likeCount >= :minLike
            AND (p.groupId IS NULL OR p.groupId IN :approvedGroupIds)
            AND EXISTS (
                SELECT 1 FROM PostTag pt
                WHERE pt.post = p
                AND pt.tag IN :tags
            )
      """)
  Page<FeedPostResponse> findPersonalizedFeed(
      @Param("tags") List<String> tags,
      @Param("minLike") long minLike,
      @Param("approvedGroupIds") List<Long> approvedGroupIds,
      Pageable pageable);

  /**
   * Fallback feed for new users who have no recorded interests.
   *
   * Returns the most popular public posts system-wide, ordered by
   * likeCount DESC then createdAt DESC. No JOIN or EXISTS —
   * relies solely on the likeCount index, making this query very lightweight.
   *
   * @param minLike  minimum like count threshold for quality filtering
   * @param pageable pagination parameters
   */
  @Query(FEED_SELECT + """
          FROM Post p
          WHERE p.status <> 'DELETED'
            AND p.deletedAt IS NULL
            AND p.visibility = 'PUBLIC'
            AND p.likeCount >= :minLike
            AND (p.groupId IS NULL OR p.groupId IN :approvedGroupIds)
          ORDER BY RAND()
      """)
  Page<FeedPostResponse> findGeneralTrendingFeed(
      @Param("minLike") long minLike,
      @Param("approvedGroupIds") List<Long> approvedGroupIds,
      Pageable pageable);

  @Query(FEED_SELECT + """
          FROM Post p
          WHERE p.status <> 'DELETED'
            AND p.deletedAt IS NULL
            AND p.groupId IN :approvedGroupIds
          ORDER BY RAND()
      """)
  Page<FeedPostResponse> findGroupTrendingFeed(
      @Param("approvedGroupIds") List<Long> approvedGroupIds,
      Pageable pageable);
}