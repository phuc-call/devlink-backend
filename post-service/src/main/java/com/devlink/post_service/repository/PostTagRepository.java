package com.devlink.post_service.repository;

import com.devlink.post_service.dto.response.TagResponse;
import com.devlink.post_service.entity.PostTag;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostTagRepository extends JpaRepository<PostTag,Long> {

    @Query("""
        SELECT new com.devlink.post_service.dto.response.TagResponse(
            t.post.id, t.id, t.tag
        )
        FROM PostTag t
        WHERE t.post.id IN :postIds
    """)
    List<TagResponse> findTagsByPostIds(@Param("postIds") List<Long> postIds);
}
