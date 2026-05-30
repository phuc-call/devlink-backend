package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.Difficulty;
import com.devlink.post_service.entity.enums.TemplateFileType;
import com.devlink.post_service.entity.enums.TemplateStatus;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateResponse {

    private Long id;
    private String title;
    private String description;
    private String language;
    private Difficulty difficulty;
    private TemplateFileType fileType;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String aiSummary;
    private List<String> tags;
    private List<String> topics;
    private Long viewCount;
    private Long forkCount;
    private TemplateStatus status;
    private Long createdBy;
    private Instant createdAt;
}