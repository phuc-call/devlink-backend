package com.devlink.post_service.dto.response;

import com.devlink.post_service.dto.client.UserFeedInfoResponse;
import com.devlink.post_service.entity.enums.AiModerationStatus;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.entity.enums.Visibility;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

// FeedPostResponse.java
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TagResponse> tags;
    private List<MediaResponse> mediaList;

    // Author info — lấy từ user-service
    private UserFeedInfoResponse author;

    // Constructor cho JPQL — không có tags và mediaList
    public FeedPostResponse(Long id, Long authorId, String content,
                            PostStatus status, Visibility visibility, PostType postType,
                            Long viewCount, Boolean isPinned,
                            AiModerationStatus aiModerationStatus,
                            LocalDateTime createdAt, LocalDateTime updatedAt) {
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
    }
}