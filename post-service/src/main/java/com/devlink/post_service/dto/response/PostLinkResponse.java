package com.devlink.post_service.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PostLinkResponse {
    private Long postId;
    private String url;
    private String label;
}
