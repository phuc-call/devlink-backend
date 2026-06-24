package com.devlink.post_service.dto.response;

import com.devlink.post_service.dto.client.UserFeedInfoClient;
import com.devlink.post_service.entity.enums.AiModerationStatus;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.entity.enums.Visibility;
import lombok.*;

import java.time.Instant;
import java.util.List;

// FeedPostResponse.java
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class FeedPostResponse {
    private Long id;
    private Long authorId;
    private String content;
    private PostStatus status;
    private Visibility visibility;
    private PostType postType;
    private Long viewCount;

    private Boolean isPinned;
    private AiModerationStatus aiModerationStatus;
    private Instant createdAt;
    private Instant updatedAt;
    private Long commentCount;
    private Long likeCount;
    private List<TagResponse> tags;
    private List<MediaResponse> mediaList;
    private Instant savedAt;
    // Author info — lấy từ user-service
    private UserFeedInfoClient author;

    @Builder
    // Constructor cho JPQL — không có tags và mediaList
    public FeedPostResponse(Long id, Long authorId, String content,
            PostStatus status, Visibility visibility, PostType postType,
            Long viewCount, Boolean isPinned,
            AiModerationStatus aiModerationStatus,
            Instant createdAt, Instant updatedAt,
            Long commentCount, Long likeCount) {
        this.id = id;
        this.authorId = authorId;
        this.content = content;
        this.status = status;
        this.visibility = visibility;
        this.postType = postType;
        this.viewCount = viewCount;
        this.isPinned = isPinned;
        this.aiModerationStatus = aiModerationStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.commentCount = commentCount;
        this.likeCount = likeCount;
    }

}