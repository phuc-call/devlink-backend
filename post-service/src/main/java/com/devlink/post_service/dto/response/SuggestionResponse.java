package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.SuggestionStatus;
import com.devlink.post_service.entity.enums.SuggestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant; @Builder
@AllArgsConstructor @Getter @Setter
public class SuggestionResponse {
    private Long id;
    private Long templateId;
    private Long userId;
    private SuggestionType suggestionType;
    private String description;

    private SuggestionStatus status;
    private Instant createdAt;
}
