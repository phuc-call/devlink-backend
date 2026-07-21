package com.devlink.post_service.repository;

import com.devlink.post_service.dto.response.TagResponse;
import com.devlink.post_service.entity.PostTag;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostTagRepository extends JpaRepository<PostTag, Long> {

    /**
     * Fetches tags for multiple posts in a single batch query — prevents N+1.
     * Used by FeedPriorityHelper.enrichAndRank().
     *
     * @param postIds list of post IDs to fetch tags for
     */
    @Query("""
        SELECT new com.devlink.post_service.dto.response.TagResponse(
            t.id, t.post.id, t.tag
        )
        FROM PostTag t
        WHERE t.post.id IN :postIds
    """)
    List<TagResponse> findTagsByPostIds(@Param("postIds") List<Long> postIds);

    /**
     * Returns only the tag strings (not full entities) for a given post.
     *
     * Returning List<String> instead of List<PostTag> avoids fetching unnecessary columns.
     * Used by InterestScoringService when recording user interactions asynchronously.
     *
     * @param postId the post whose tags should be retrieved
     */
    @Query("SELECT pt.tag FROM PostTag pt WHERE pt.post.id = :postId")
    List<String> findTagStringsByPostId(@Param("postId") Long postId);
}
