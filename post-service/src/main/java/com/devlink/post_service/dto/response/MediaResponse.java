package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaResponse {
    private Long postId;
    private Long id;
    private MediaType mediaType;
    private String url;
    private String thumbnailUrl;
    private String originalName;
    private String fileExtension;
    private Long fileSize;
    private Integer orderIndex;
}