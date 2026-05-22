package com.devlink.post_service.repository;

import com.devlink.post_service.entity.UserStorageConfig;
import feign.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface UserStorageConfigRepository extends JpaRepository<UserStorageConfig, Long> {

    Optional<UserStorageConfig> findByUserId(Long userId);
//Bật autoSaveEnabled = true
    @Query(value = """
            SELECT c.user_id
            FROM user_storage_config c
            WHERE c.auto_save_enabled = true
              AND c.user_id != :authorId
              AND (
                  JSON_OVERLAPS(c.match_topics,    :tagsJson) = 1
                  OR
                  JSON_OVERLAPS(c.match_interests, :tagsJson) = 1
              )
              AND NOT EXISTS (
                  SELECT 1 FROM user_saved_posts sp
                  WHERE sp.user_id = c.user_id
                    AND sp.post_id = :postId
              )
            """, nativeQuery = true)
    List<Long> findUserIdsToAutoSave(
            @Param("authorId") Long authorId,
            @Param("postId")   Long postId,
            @Param("tagsJson") String tagsJson   // JSON array string: ["java","spring"]
    );
}