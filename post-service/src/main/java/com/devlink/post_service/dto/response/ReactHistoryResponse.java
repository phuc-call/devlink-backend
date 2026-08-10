package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.ReactionType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class ReactHistoryResponse {
    private Long reactId;
    private LocalDateTime createdAt;
    private Long postId;
    private String postContent;
    private List<MediaResponse> files;
    private Long authorId;
    private String authorName;
    private String authorAvatarUrl;
    private ReactionType reactionType;

    public ReactHistoryResponse(Long reactId, LocalDateTime createdAt, Long postId, 
                                String postContent, Long authorId, ReactionType reactionType) {
        this.reactId = reactId;
        this.createdAt = createdAt;
        this.postId = postId;
        this.postContent = postContent;
        this.authorId = authorId;
        this.reactionType = reactionType;
    }
}

