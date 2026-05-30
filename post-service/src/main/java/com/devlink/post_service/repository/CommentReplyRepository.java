package com.devlink.post_service.repository;

import com.devlink.post_service.dto.procedure.CommentReplyProcedureResult;
import com.devlink.post_service.entity.CommentReply;
import org.springframework.data.jpa.repository.JpaRepository;
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

}