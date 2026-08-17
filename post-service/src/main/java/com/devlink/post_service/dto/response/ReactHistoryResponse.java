package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.ReactionType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReactHistoryResponse {
    private Long reactId;
    private LocalDateTime createdAt;
    private Long postId;
    private String postContent;
    private List<PostImageUrlResponse> files;
    private Long authorId;
    private String authorName;
    private String authorAvatarUrl;
    private ReactionType reactionType;
    private Long groupId;
    private String groupName;
    private String groupImage;

    public ReactHistoryResponse(Long reactId, LocalDateTime createdAt, Long postId,
            String postContent, Long authorId,
            String authorName, String authorAvatarUrl,
            ReactionType reactionType, Long groupId) {
        this.reactId = reactId;
        this.createdAt = createdAt;
        this.postId = postId;
        this.postContent = postContent;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorAvatarUrl = authorAvatarUrl;
        this.reactionType = reactionType;
        this.groupId = groupId;
    }
}
