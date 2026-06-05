package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.Difficulty;
import com.devlink.post_service.entity.enums.TemplateFileType;
import com.devlink.post_service.entity.enums.TemplateStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TemplateStatsProjectionResponse {
    private TemplateStatus status;
    private String language;
    private TemplateFileType fileType;
    private Difficulty difficulty;
    private Long count;
    private Long totalViews;
}