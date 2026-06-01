package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.Difficulty;
import com.devlink.post_service.entity.enums.TemplateFileType;
import com.devlink.post_service.entity.enums.TemplateStatus;
import lombok.*;

import java.time.Instant;
@Builder @AllArgsConstructor @NoArgsConstructor @Getter @Setter
public class TemplateCardResponse {
    private Long id;
    private String title;
    private String language;
    private Difficulty difficulty;
    private TemplateFileType fileType;
    private String fileUrl;
    private String fileName;
    private String aiSummary;
    private Long viewCount;
    private Long forkCount;
    private TemplateStatus status;
    private Instant createdAt;
    private Boolean isFork;
}
