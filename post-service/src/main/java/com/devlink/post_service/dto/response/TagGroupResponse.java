package com.devlink.post_service.dto.response;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TagGroupResponse {
    private Long id;
    private String name;
    private String description;
    private List<String> tags;
    private boolean autoAssignable;
    private String matchKeyword;
    private Long createdBy;
    private Instant createdAt;
    private Instant updatedAt;
    private Long assignedUserCount;
}
