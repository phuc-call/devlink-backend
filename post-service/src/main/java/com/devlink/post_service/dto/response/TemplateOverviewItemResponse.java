package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.Difficulty;
import com.devlink.post_service.entity.enums.TemplateFileType;
import com.devlink.post_service.entity.enums.TemplateStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
@Builder(toBuilder = true)
@Getter
@AllArgsConstructor @NoArgsConstructor
public class TemplateOverviewItemResponse {
    private Long id;
    private String title;
    private String language;
    private String difficulty;
    private String fileType;
    private String status;
    private Long viewCount;
    private Long forkCount;
    private Instant createdAt;

    public TemplateOverviewItemResponse(Long id, String title, String language,
                                        Difficulty difficulty, TemplateFileType fileType, TemplateStatus status,
                                        Long viewCount, Long forkCount, Instant createdAt) {
        this.id = id;
        this.title = title;
        this.language = language;
        this.difficulty = difficulty.name();
        this.fileType = fileType.name();
        this.status = status.name();
        this.viewCount = viewCount;
        this.forkCount = forkCount;
        this.createdAt = createdAt;
    }

}
