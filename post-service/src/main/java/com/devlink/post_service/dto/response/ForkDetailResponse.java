package com.devlink.post_service.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder

public class ForkDetailResponse {
    private Long id;
    private Long templateId;
    private String title;
    private String content;
    private String fileUrl;
    private boolean isProposed;
    private Long suggestionId;
    private Boolean isModified;
    private LocalDateTime lastEditedAt;
    private LocalDateTime createdAt;
}
