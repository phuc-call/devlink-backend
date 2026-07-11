package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.AiModerationStatus;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.entity.enums.Visibility;
import lombok.*;

import java.time.Instant;

import java.util.List;
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponse {
    private Long id;
    private Long authorId;
    private Long groupId;
    private String content;
    private PostStatus status;
    private Visibility visibility;
    private PostType postType;
    private AiModerationStatus aiModerationStatus;
    private List<String> tags;
    private List<MediaResponse> mediaList;
    private Instant createdAt;

}