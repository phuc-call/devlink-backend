package com.devlink.post_service.repository;

import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.entity.enums.RestrictionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;  // ← đúng import

import java.time.LocalDateTime;
import java.util.List;

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
            @Param("now") LocalDateTime now
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

    @Query("""
        SELECT new com.devlink.post_service.dto.response.FeedPostResponse(
            p.id, p.authorId, p.content,
            p.status, p.visibility, p.postType,
            p.viewCount, p.isPinned, p.aiModerationStatus,
            p.createdAt, p.updatedAt
        )
        FROM Post p
        WHERE p.id IN :ids
        ORDER BY p.createdAt DESC
    """)
    List<FeedPostResponse> findFeedPostDtos(@Param("ids") List<Long> ids);

    @Query("SELECT COUNT(p)>0 FROM Post p WHERE p.id=:id AND p.status<>:status")
    boolean existsByIdAndStatusNot(@Param("id") Long id, @Param("status") PostStatus status);


}