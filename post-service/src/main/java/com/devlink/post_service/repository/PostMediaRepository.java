package com.devlink.post_service.repository;

import com.devlink.post_service.dto.response.MediaResponse;
import com.devlink.post_service.entity.PostMedia;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
}