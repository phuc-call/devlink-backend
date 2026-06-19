package com.devlink.post_service.repository;

import com.devlink.post_service.dto.procedure.ReactionCountProjection;
import com.devlink.post_service.entity.Reaction;
import com.devlink.post_service.entity.enums.TargetType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
@Component
public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    /**
     * Deletes all reactions belonging to a post and every comment/reply inside it.
     * Used when an entire post is removed (report approved on POST target).
     */
    @Modifying
    @Query("""
        DELETE FROM Reaction r WHERE
            (r.targetId = :postId AND r.targetType = 'POST')
            OR (r.targetId IN (SELECT c.id FROM Comment c WHERE c.postId = :postId)
                AND r.targetType = 'COMMENT')
            OR (r.targetId IN (SELECT cr.id FROM CommentReply cr WHERE cr.postId = :postId)
                AND r.targetType = 'COMMENT_REPLY')
    """)
    void deleteAllReactionsByPostId(@Param("postId") Long postId);

    /**
     * Deletes all reactions on a comment and all its replies.
     * Used when a comment is removed (report approved on COMMENT target).
     */
    @Modifying
    @Query("""
        DELETE FROM Reaction r WHERE
            (r.targetId = :commentId AND r.targetType = 'COMMENT')
            OR (r.targetId IN (SELECT cr.id FROM CommentReply cr WHERE cr.comment.id = :commentId)
                AND r.targetType = 'COMMENT_REPLY')
    """)
    void deleteAllReactionsByCommentId(@Param("commentId") Long commentId);

    /**
     * Deletes reactions on a reply and all its sub-replies.
     * Used when a reply is removed (report approved on COMMENT_REPLY target).
     */
    @Modifying
    @Query("""
        DELETE FROM Reaction r WHERE
            (r.targetId = :replyId AND r.targetType = 'COMMENT_REPLY')
            OR (r.targetId IN (SELECT cr.id FROM CommentReply cr WHERE cr.parentReply.id = :replyId)
                AND r.targetType = 'COMMENT_REPLY')
    """)
    void deleteAllReactionsByReplyId(@Param("replyId") Long replyId);

    Optional<Reaction> findByTargetIdAndTargetTypeAndUserId(
            Long targetId, TargetType targetType, Long userId
    );

    //only type >0
    @Query("""
            SELECT r.reactionType AS reactionType, COUNT(r) AS count
            FROM Reaction r
            WHERE r.targetId = :targetId AND r.targetType = :targetType
            GROUP BY r.reactionType
            """)
    List<ReactionCountProjection> countGroupedByType(
            @Param("targetId") Long targetId,
            @Param("targetType") TargetType targetType
    );

    @Query("""
    SELECT r.reactionType AS reactionType, COUNT(r) AS count
    FROM Reaction r
    WHERE r.targetId = :targetId
      AND r.targetType = :targetType
    GROUP BY r.reactionType
    ORDER BY COUNT(r) DESC
""")
    List<ReactionCountProjection> findTopReactionTypes(
            @Param("targetId") Long targetId,
            @Param("targetType") TargetType targetType,
            Pageable pageable
    );

}