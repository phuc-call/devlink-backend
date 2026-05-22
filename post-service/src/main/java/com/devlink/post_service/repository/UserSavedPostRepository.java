package com.devlink.post_service.repository;

import com.devlink.post_service.entity.UserSavedPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSavedPostRepository extends JpaRepository<UserSavedPost, Long> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);
}