package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.SuggestionStatus;
import com.devlink.post_service.entity.enums.SuggestionType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
@Getter
@Builder
public class SuggestionDetailResponse {
    private Long id;
    private Long templateId;
    private Long userId;
    private SuggestionType suggestionType;
    private String description;

    private SuggestionStatus status;
    private Instant createdAt;

    // fork info
    private Long forkId;
    private String forkTitle;
    private String forkContent;
    private String forkFileUrl;
    private Instant forkLastEditedAt;
}
