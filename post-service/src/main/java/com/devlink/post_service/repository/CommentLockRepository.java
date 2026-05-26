package com.devlink.post_service.repository;

import com.devlink.post_service.entity.CommentLock;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface CommentLockRepository extends JpaRepository<CommentLock,Long> {
    // Khóa toàn service (postId IS NULL)
    @Query("""
            SELECT COUNT(cl) > 0 FROM CommentLock cl
            WHERE cl.userId = :userId
              AND cl.postId IS NULL
              AND cl.lockedUntil > :now
            """)
    boolean existsGlobalLockForUser(@Param("userId") Long userId,
                                    @Param("now") LocalDateTime now);

    // Khóa trên bài viết cụ thể
    @Query("""
            SELECT COUNT(cl) > 0 FROM CommentLock cl
            WHERE cl.userId = :userId
              AND cl.postId = :postId
              AND cl.lockedUntil > :now
            """)
    boolean existsPostLockForUser(@Param("userId") Long userId,
                                  @Param("postId") Long postId,
                                  @Param("now") LocalDateTime now);
}
