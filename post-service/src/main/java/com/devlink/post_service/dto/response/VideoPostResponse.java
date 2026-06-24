package com.devlink.post_service.dto.response;

import lombok.*;

import java.time.Instant;

/**
 * Projection used by PostRepository to fetch active VIDEO posts.
 * Only fields actually rendered to the client are included.
 * Internal flags (status, postType, aiModerationStatus) are enforced
 * at the query level — they never need to reach the response layer.
 *
 * <p>{@code videoFileSize} is kept for internal scoring / short-vs-long
 * classification and is NOT forwarded to the client response.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VideoPostResponse {

    private Long postId;
    private Long authorId;
    private String content;
    private Long viewCount;
    private Instant createdAt;
    private Instant updatedAt;
    private Long commentCount;
    private Long likeCount;
    /**
     * Used internally to distinguish short vs long videos (not sent to client).
     */
    private Long videoFileSize;
}
