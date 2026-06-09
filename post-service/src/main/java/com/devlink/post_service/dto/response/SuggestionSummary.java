package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.SuggestionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class SuggestionSummary {
    private Long id;
    private Long forkId;
    private Long userId;
    private Long templateId;
    private SuggestionStatus status;
    private Instant createdAt;

}