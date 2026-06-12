package com.devlink.post_service.dto.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReportCreatedEvent {
    Long reportId;
    Long reporterId;
    Long targetId;
    String targetType;
    String reason;
    String description;
    @JsonProperty("isUpdate")
    private boolean isUpdate;
}
