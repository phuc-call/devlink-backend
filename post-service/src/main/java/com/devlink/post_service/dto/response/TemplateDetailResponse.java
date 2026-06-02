package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.Difficulty;
import com.devlink.post_service.entity.enums.TemplateFileType;
import com.devlink.post_service.entity.enums.TemplateStatus;
import lombok.*;

import java.time.Instant;

@Builder
@AllArgsConstructor @NoArgsConstructor
@Getter @Setter
public class TemplateDetailResponse {
    private Long id;
    private String title;
    private String description;
    private String language;
    private Difficulty difficulty;
    private TemplateFileType fileType;

    private String fileUrl;
    private String fileName;
    private Long fileSize;

    // have value when fileType = CODE
    private String content;

    private String aiSummary;

    private String tags;
    private String topics;


    private Long viewCount;
    private Long forkCount;
    private Long createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    private ForkInfoResponse forkInfo;
    private TemplateStatus status;
}