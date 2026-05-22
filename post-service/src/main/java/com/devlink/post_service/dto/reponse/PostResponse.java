package com.devlink.post_service.dto.reponse;

import com.devlink.post_service.entity.enums.AiModerationStatus;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.entity.enums.Visibility;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostResponse {
    private Long id;
    private Long authorId;
    private String content;
    private PostStatus status;
    private Visibility visibility;
    private PostType postType;
    private AiModerationStatus aiModerationStatus;
    private List<String> tags;
    private List<MediaResponse> mediaList;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class MediaResponse {
        private Long id;
        private String mediaType;
        private String url;
        private String originalName;
        private String fileExtension;
        private Long fileSize;
        private Integer orderIndex;
    }
}