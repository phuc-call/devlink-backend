package com.devlink.post_service.repository;

import com.devlink.post_service.dto.response.MediaResponse;
import com.devlink.post_service.dto.response.PostImageUrlResponse;
import com.devlink.post_service.entity.PostMedia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {

    @Query("""
                SELECT new com.devlink.post_service.dto.response.MediaResponse(
                    m.post.id, m.id, m.mediaType,
                    m.url, m.thumbnailUrl, m.originalName,
                    m.fileExtension, m.fileSize, m.orderIndex
                )
                FROM PostMedia m
                WHERE m.post.id IN :postIds
                ORDER BY m.orderIndex ASC
            """)
    List<MediaResponse> findMediaByPostIds(@Param("postIds") List<Long> postIds);

    @Query("""
                SELECT new com.devlink.post_service.dto.response.PostImageUrlResponse(
                    m.post.id, m.url
                )
                FROM PostMedia m
                WHERE m.post.id IN :postIds
                  AND m.mediaType = 'IMAGE'
                ORDER BY m.orderIndex ASC
            """)
    List<PostImageUrlResponse> findImageUrlsByPostIds(@Param("postIds") List<Long> postIds);

    @Query("""
                SELECT new com.devlink.post_service.dto.response.MediaResponse(
                    m.post.id, m.id, m.mediaType,
                    m.url, m.thumbnailUrl, m.originalName,
                    m.fileExtension, m.fileSize, m.orderIndex
                )
                FROM PostMedia m
                WHERE m.post.id IN :postIds AND m.mediaType = 'IMAGE'
                ORDER BY m.post.createdAt DESC
            """)
    Page<MediaResponse> findImagesByPostIds(@Param("postIds") List<Long> postIds, Pageable pageable);

    @Query("""
                SELECT new com.devlink.post_service.dto.response.MediaResponse(
                    m.post.id, m.id, m.mediaType,
                    m.url, m.thumbnailUrl, m.originalName,
                    m.fileExtension, m.fileSize, m.orderIndex
                )
                FROM PostMedia m
                WHERE m.post.id IN :postIds AND m.mediaType = 'VIDEO'
                ORDER BY m.post.createdAt DESC
            """)
    Page<MediaResponse> findVideosByPostIds(@Param("postIds") List<Long> postIds, Pageable pageable);

    @Query("""
                SELECT new com.devlink.post_service.dto.response.MediaResponse(
                    m.post.id, m.id, m.mediaType,
                    m.url, m.thumbnailUrl, m.originalName,
                    m.fileExtension, m.fileSize, m.orderIndex
                )
                FROM PostMedia m
                WHERE m.post.id IN :postIds AND m.mediaType = 'FILE'
                ORDER BY m.post.createdAt DESC
            """)
    Page<MediaResponse> findFilesByPostIds(@Param("postIds") List<Long> postIds, Pageable pageable);

    @Query("""
                SELECT m.url
                FROM PostMedia m
                WHERE m.post.authorId = :userId
                  AND m.mediaType = 'IMAGE'
                  AND m.post.status <> 'DELETED'
                  AND m.post.deletedAt IS NULL
                  AND m.post.visibility = 'PUBLIC'
                ORDER BY m.post.createdAt DESC
            """)
    Page<String> findPublicImageUrlsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
                SELECT m.url
                FROM PostMedia m
                WHERE m.post.authorId = :userId
                  AND m.mediaType = 'IMAGE'
                  AND m.post.status <> 'DELETED'
                  AND m.post.deletedAt IS NULL
                ORDER BY m.post.createdAt DESC
            """)
    Page<String> findAllImageUrlsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
        SELECT new com.devlink.post_service.dto.response.MediaResponse(
            m.post.id, m.id, m.mediaType,
            m.url, m.thumbnailUrl, m.originalName,
            m.fileExtension, m.fileSize, m.orderIndex
        )
        FROM PostMedia m
        WHERE m.post.authorId = :userId
          AND m.mediaType = 'IMAGE'
          AND m.post.status <> 'DELETED'
          AND m.post.deletedAt IS NULL
          AND m.post.visibility = 'PUBLIC'
        ORDER BY m.post.createdAt DESC
    """)
    Page<MediaResponse> findPublicImageDetailsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
        SELECT new com.devlink.post_service.dto.response.MediaResponse(
            m.post.id, m.id, m.mediaType,
            m.url, m.thumbnailUrl, m.originalName,
            m.fileExtension, m.fileSize, m.orderIndex
        )
        FROM PostMedia m
        WHERE m.post.authorId = :userId
          AND m.mediaType = 'IMAGE'
          AND m.post.status <> 'DELETED'
          AND m.post.deletedAt IS NULL
        ORDER BY m.post.createdAt DESC
    """)
    Page<MediaResponse> findAllImageDetailsByUserId(@Param("userId") Long userId, Pageable pageable);
}
