package com.devlink.post_service.dto.response;

import lombok.*;

import java.time.Instant;
import java.util.List;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoFeedResponse {
    private Long id;
    private Long authorId;
    private String content;
    private Long viewCount;
    private Instant createdAt;
    private Instant updatedAt;
    private Long commentCount;
    private Long likeCount;
    private List<TagResponse> tags;
    /** All media attachments (video + thumbnails) */
    private List<MediaResponse> mediaList;
    /** Author display info enriched from local user_profiles table */
    private AuthorInfo author;
    /**
     * "PRIORITY" (top ~80%) or "DISCOVERY" (bottom ~20%).
     */
    private String feedBucket;
    /**
     * Computed priority score — higher = shown earlier.
     * Formula: likeCount×1.0
     */
    private Double priorityScore;
}
