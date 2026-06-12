package com.devlink.post_service.repository;

import com.devlink.post_service.dto.response.CommentProjection;
import com.devlink.post_service.entity.Comment;
import com.devlink.post_service.entity.enums.CommentStatus;

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
public interface CommentRepository extends JpaRepository<Comment,Long> {
    Optional<Comment> findByIdAndPostId(Long id, Long postId);
    @Query("""
            SELECT COUNT(c) FROM Comment c
            WHERE c.postId = :postId
              AND c.status IN :statuses
            """)
    long countTopLevelComments(
            @Param("postId")   Long postId,
            @Param("statuses") List<CommentStatus> statuses
    );

    @Query("""
             SELECT new com.devlink.post_service.dto.response.CommentProjection(
                             c.id, c.postId, c.authorId,
                             c.content, c.status, c.replyCount, c.likeCount, c.createdAt
                         )
            FROM Comment c
            WHERE c.postId = :postId
              AND c.status IN :statuses
            ORDER BY
                CASE WHEN c.authorId = :postOwnerId THEN 0 ELSE 1 END ASC,
                c.createdAt DESC
            """)
    Page<CommentProjection> findTopLevelSortByDate(
            @Param("postId")      Long postId,
            @Param("postOwnerId") Long postOwnerId,
            @Param("statuses")    List<CommentStatus> statuses,
            Pageable pageable
    );

    @Query("""
         SELECT new com.devlink.post_service.dto.response.CommentProjection(
                         c.id, c.postId, c.authorId,
                         c.content, c.status,c.replyCount, c.likeCount, c.createdAt
                     )
        FROM Comment c
        WHERE c.postId = :postId
          AND c.status IN :statuses
        ORDER BY
            CASE WHEN c.authorId = :postOwnerId THEN 0 ELSE 1 END ASC,
            c.likeCount DESC
        """)
    Page<CommentProjection> findTopLevelSortByLike(
            @Param("postId")      Long postId,
            @Param("postOwnerId") Long postOwnerId,
            @Param("statuses")    List<CommentStatus> statuses,
            Pageable pageable
    );

    @Modifying
    @Query("DELETE FROM Comment c WHERE c.postId = :postId")
    void deleteAllByPostId(@Param("postId") Long postId);
}
