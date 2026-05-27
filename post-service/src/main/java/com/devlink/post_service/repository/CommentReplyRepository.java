package com.devlink.post_service.repository;

import com.devlink.post_service.entity.CommentReply;
import com.devlink.post_service.entity.enums.CommentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentReplyRepository extends JpaRepository<CommentReply, Long> {

    /** Tìm reply theo id để validate parentReplyId */
    Optional<CommentReply> findByIdAndPostId(Long id, Long postId);

    //Lấy danh sách replies của 1 top-level comment.
    @Query("""
        SELECT r FROM CommentReply r
        WHERE r.comment.id = :commentId
          AND r.status IN :statuses
        ORDER BY r.createdAt ASC
        """)
    Page<CommentReply> findByCommentId(
            @Param("commentId") Long commentId,
            @Param("statuses")  List<CommentStatus> statuses,
            Pageable pageable
    );

    /** Đếm tổng replies của 1 comment */
    @Query("""
        SELECT COUNT(r) FROM CommentReply r
        WHERE r.comment.id = :commentId
          AND r.status IN :statuses
        """)
    long countByCommentId(
            @Param("commentId") Long commentId,
            @Param("statuses")  List<CommentStatus> statuses
    );
}