package com.devlink.post_service.repository;

import com.devlink.post_service.dto.procedure.FeedPostProcedureResult;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.ReactHistoryResponse;
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

    @Query("""
                SELECT new com.devlink.post_service.dto.response.ReactHistoryResponse(
                    r.id, r.createdAt, p.id, p.content, p.authorId,
                    up.userName, up.avatarUrl, r.reactionType, p.groupId
                )
                FROM Post p
                JOIN Reaction r ON r.targetId = p.id AND r.targetType = com.devlink.post_service.entity.enums.TargetType.POST
                LEFT JOIN UserProfile up ON up.userId = p.authorId
                WHERE r.userId = :userId
                  AND p.status NOT IN (PostStatus.DELETED)
                  AND p.deletedAt IS NULL
                  AND p.authorId NOT IN :blockedIds
                  AND (
                      p.visibility = Visibility.PUBLIC
                      OR (p.visibility = Visibility.FOLLOWERS_ONLY AND p.authorId IN :friendIds)
                      OR p.authorId = :userId
                  )
                  AND (
                      p.groupId IS NULL
                      OR p.groupId IN :approvedGroupIds
                  )
                ORDER BY r.createdAt DESC
            """)
    Page<ReactHistoryResponse> findReactedPostsByUser(
            @Param("userId") Long userId,
            @Param("friendIds") List<Long> friendIds,
            @Param("blockedIds") List<Long> blockedIds,
            @Param("approvedGroupIds") List<Long> approvedGroupIds,
            Pageable pageable);


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
     * Kỹ thuật Random ID Range — thay thế ORDER BY RAND():
     * 1. Service gọi findPersonalizedFeedMinMaxId() để lấy [minId, maxId] của tập điều kiện.
     * 2. Service tính randomOffset = ThreadLocalRandom.current().nextLong(minId, maxId + 1).
     * 3. Query này dùng WHERE p.id >= :randomOffset ORDER BY p.id
     *    → MySQL sử dụng idx_feed_public (PK range scan) thay vì full table scan.
     * 4. Nếu kết quả < size (offset gần MAX), Service sẽ gọi thêm lần nữa từ minId.
     *
     * @param tags          user's top interest tags
     * @param minLike       minimum like count threshold
     * @param approvedGroupIds groups the user belongs to
     * @param randomOffset  ngẫu nhiên trong [minId, maxId], tính bên Service
     * @param pageable      pagination (chỉ dùng size, không dùng page offset)
     */
    @Query(value = FEED_SELECT + """
                FROM Post p
                WHERE p.status <> 'DELETED'
                  AND p.deletedAt IS NULL
                  AND p.visibility = 'PUBLIC'
                  AND p.likeCount >= :minLike
                  AND (p.groupId IS NULL OR p.groupId IN :approvedGroupIds)
                  AND p.id >= :randomOffset
                  AND EXISTS (
                      SELECT 1 FROM PostTag pt
                      WHERE pt.post = p
                      AND pt.tag IN :tags
                  )
                ORDER BY p.id ASC
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
            @Param("randomOffset") long randomOffset,
            Pageable pageable);

    /**
     * Lấy khoảng [MIN(id), MAX(id)] của tập bài viết personalized để tính random offset.
     * Trả về long[2]: [0] = minId, [1] = maxId.
     */
    @Query("""
                SELECT MIN(p.id), MAX(p.id)
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
    Object[] findPersonalizedFeedMinMaxId(
            @Param("tags") List<String> tags,
            @Param("minLike") long minLike,
            @Param("approvedGroupIds") List<Long> approvedGroupIds);

    /**
     * Fallback feed cho user mới chưa có interests.
     *
     * Dùng Random ID Range thay ORDER BY RAND():
     * Service tính randomOffset trong [minId, maxId] rồi truyền vào.
     * MySQL dùng idx_feed_public để range scan theo PK.
     *
     * @param minLike       minimum like count threshold
     * @param approvedGroupIds groups the user belongs to
     * @param randomOffset  ngẫu nhiên trong [minId, maxId], tính bên Service
     * @param pageable      chỉ dùng size
     */
    @Query(FEED_SELECT + """
                FROM Post p
                WHERE p.status <> 'DELETED'
                  AND p.deletedAt IS NULL
                  AND p.visibility = 'PUBLIC'
                  AND p.likeCount >= :minLike
                  AND (p.groupId IS NULL OR p.groupId IN :approvedGroupIds)
                  AND p.id >= :randomOffset
                ORDER BY p.id ASC
            """)
    Page<FeedPostResponse> findGeneralTrendingFeed(
            @Param("minLike") long minLike,
            @Param("approvedGroupIds") List<Long> approvedGroupIds,
            @Param("randomOffset") long randomOffset,
            Pageable pageable);

    /**
     * Lấy khoảng [MIN(id), MAX(id)] của tập bài trending để tính random offset.
     */
    @Query("""
                SELECT MIN(p.id), MAX(p.id)
                FROM Post p
                WHERE p.status <> 'DELETED'
                  AND p.deletedAt IS NULL
                  AND p.visibility = 'PUBLIC'
                  AND p.likeCount >= :minLike
                  AND (p.groupId IS NULL OR p.groupId IN :approvedGroupIds)
            """)
    Object[] findGeneralTrendingMinMaxId(
            @Param("minLike") long minLike,
            @Param("approvedGroupIds") List<Long> approvedGroupIds);

    /**
     * Feed nhóm dùng Random ID Range thay ORDER BY RAND().
     * MySQL dùng idx_feed_group (group_id, status, deleted_at, id).
     */
    @Query(FEED_SELECT + """
                FROM Post p
                WHERE p.status <> 'DELETED'
                  AND p.deletedAt IS NULL
                  AND p.groupId IN :approvedGroupIds
                  AND p.id >= :randomOffset
                ORDER BY p.id ASC
            """)
    Page<FeedPostResponse> findGroupTrendingFeed(
            @Param("approvedGroupIds") List<Long> approvedGroupIds,
            @Param("randomOffset") long randomOffset,
            Pageable pageable);

    /**
     * Lấy khoảng [MIN(id), MAX(id)] của tập bài nhóm để tính random offset.
     */
    @Query("""
                SELECT MIN(p.id), MAX(p.id)
                FROM Post p
                WHERE p.status <> 'DELETED'
                  AND p.deletedAt IS NULL
                  AND p.groupId IN :approvedGroupIds
            """)
    Object[] findGroupTrendingMinMaxId(
            @Param("approvedGroupIds") List<Long> approvedGroupIds);

    @Query(value = FEED_SELECT + """
                FROM Post p
                WHERE p.status <> 'DELETED'
                  AND p.deletedAt IS NULL
                  AND (p.visibility = 'PUBLIC'
                       OR (p.visibility = 'FOLLOWERS_ONLY' AND p.authorId IN :friendIds)
                       OR p.authorId = :currentUserId)
                  AND (p.groupId IS NULL OR p.groupId IN :approvedGroupIds)
                  AND EXISTS (
                      SELECT 1 FROM PostTag pt
                      WHERE pt.post = p
                      AND LOWER(pt.tag) LIKE LOWER(CONCAT('%', :tag, '%'))
                  )
                ORDER BY p.createdAt DESC
            """, countQuery = """
                SELECT count(p.id)
                FROM Post p
                WHERE p.status <> 'DELETED'
                  AND p.deletedAt IS NULL
                  AND (p.visibility = 'PUBLIC'
                       OR (p.visibility = 'FOLLOWERS_ONLY' AND p.authorId IN :friendIds)
                       OR p.authorId = :currentUserId)
                  AND (p.groupId IS NULL OR p.groupId IN :approvedGroupIds)
                  AND EXISTS (
                      SELECT 1 FROM PostTag pt
                      WHERE pt.post = p
                      AND LOWER(pt.tag) LIKE LOWER(CONCAT('%', :tag, '%'))
                  )
            """)
    Page<FeedPostResponse> findPostsByTag(
            @Param("tag") String tag,
            @Param("currentUserId") Long currentUserId,
            @Param("friendIds") List<Long> friendIds,
            @Param("approvedGroupIds") List<Long> approvedGroupIds,
            Pageable pageable);

    /**
     * Fetch minimal post data for a set of post IDs (used by admin viewed posts)
     */
    @Query(FEED_SELECT + "FROM Post p WHERE p.id IN :postIds ORDER BY p.createdAt DESC")
    List<FeedPostResponse> findByIdIn(@Param("postIds") List<Long> postIds);
}