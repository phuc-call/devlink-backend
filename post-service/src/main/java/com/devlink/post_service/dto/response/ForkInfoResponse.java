package com.devlink.post_service.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
@Builder @Getter
public class ForkInfoResponse {
    private Long forkId;
    private Boolean isModified;
    private LocalDateTime lastEditedAt;
    private LocalDateTime createdAt;
}
