package com.devlink.post_service.repository;

import com.devlink.post_service.dto.procedure.CommentReplyProcedureResult;
import com.devlink.post_service.dto.response.CommentReplyNotificationResponse;
import com.devlink.post_service.entity.CommentReply;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentReplyRepository extends JpaRepository<CommentReply, Long> {

    /**
     * Tìm reply theo id để validate parentReplyId
     */
    Optional<CommentReply> findByIdAndPostId(Long id, Long postId);

    /**
     * Returns paginated active replies for a given comment thread
     * via stored procedure, mapped to projection (display fields only).
     */
    @Query(value = "CALL get_replies_comment(:commentId, :offset, :limit)", nativeQuery = true)
    List<CommentReplyProcedureResult> findRepliesByProcedure(
            @Param("commentId") Long commentId,
            @Param("offset") int offset,
            @Param("limit") int limit
    );


    /**
     * Counts total active replies for a given comment thread.
     * Used to build Page metadata (totalElements, totalPages).
     */
    @Query(value = "CALL count_rep_comment(:commentId)",nativeQuery = true)
    long countActiveByCommentId(@Param("commentId") long commentId);

    @Modifying
    @Query("DELETE FROM CommentReply cr WHERE cr.comment.postId = :postId")
    void deleteAllByPostId(@Param("postId") Long postId);

    @Modifying
    @Query("DELETE FROM CommentReply cr WHERE cr.parentReply.id = :parentReplyId")
    void deleteByParentReplyId(@Param("parentReplyId") Long parentReplyId);

    /**
     * Returns replies made to comments authored by the current user, with visibility and block filtering.
     *
     * Block rules:
     * - Post author blocked the user: the post is excluded, so related replies are hidden.
     * - Replier blocked the user: replies are still visible (replier ID is not filtered).
     *
     * Visibility: PUBLIC posts, FOLLOWERS_ONLY posts where the user follows the author,
     * or posts authored by the user. Group posts are shown only if the user is an approved member.
     */
    @Query("""
            SELECT new com.devlink.post_service.dto.response.CommentReplyNotificationResponse(
                cr.id, cr.content, cr.createdAt,
                cr.authorId, up.userName, up.avatarUrl,
                c.id, c.content,
                p.id, p.content,
                p.groupId
            )
            FROM CommentReply cr
            JOIN cr.comment c
            JOIN Post p ON p.id = c.postId
            LEFT JOIN UserProfile up ON up.userId = cr.authorId
            WHERE c.authorId = :currentUserId
              AND cr.status <> CommentStatus.DELETED
              AND c.status  <> CommentStatus.DELETED
              AND p.status  NOT IN (PostStatus.DELETED)
              AND p.deletedAt IS NULL
              AND p.authorId NOT IN :blockedIds
              AND (
                  p.visibility = Visibility.PUBLIC
                  OR (p.visibility = Visibility.FOLLOWERS_ONLY AND p.authorId IN :friendIds)
                  OR p.authorId = :currentUserId
              )
              AND (p.groupId IS NULL OR p.groupId IN :approvedGroupIds)
            ORDER BY cr.createdAt DESC
            """)
    Page<CommentReplyNotificationResponse> findReplyHistoryForCommentAuthor(
            @Param("currentUserId") Long currentUserId,
            @Param("friendIds")     List<Long> friendIds,
            @Param("blockedIds")    List<Long> blockedIds,
            @Param("approvedGroupIds") List<Long> approvedGroupIds,
            Pageable pageable);
}