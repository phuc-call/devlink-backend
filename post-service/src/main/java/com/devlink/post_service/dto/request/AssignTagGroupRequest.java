package com.devlink.post_service.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AssignTagGroupRequest {

    @NotEmpty(message = "User IDs must not be empty")
    private List<Long> userIds;

    @NotEmpty(message = "Tag group IDs must not be empty")
    private List<Long> tagGroupIds;
}
