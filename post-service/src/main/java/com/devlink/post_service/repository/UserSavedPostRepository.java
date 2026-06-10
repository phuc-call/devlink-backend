package com.devlink.post_service.repository;

import com.devlink.post_service.dto.response.SavePostProjectionResponse;
import com.devlink.post_service.entity.UserSavedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSavedPostRepository extends JpaRepository<UserSavedPost, Long> {
    boolean existsByUserIdAndPostId(Long userId, Long postId);
    Optional<UserSavedPost> findByUserIdAndPostId(Long userId, Long postId);
    @Query("SELECT s.postId FROM UserSavedPost s WHERE s.userId = :userId ORDER BY s.savedAt DESC")
    Page<Long> findPostIdsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT new com.devlink.post_service.dto.response.SavePostProjectionResponse(" +
            "usp.postId, usp.savedAt) " +
            "FROM UserSavedPost usp " +
            "WHERE usp.userId = :userId AND usp.postId IN :postIds")
    List<SavePostProjectionResponse> findSavedAtByUserIdAndPostIds(@Param("userId") Long userId, @Param("postIds") List<Long> postIds);
}