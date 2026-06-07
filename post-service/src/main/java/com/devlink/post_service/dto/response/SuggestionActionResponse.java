package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.SuggestionStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
@Getter @Builder @NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SuggestionActionResponse {
    private Long id;
    private SuggestionStatus status;
    private String rejectReason;
    private Instant reviewedAt;
    private Long reviewedBy;
}
