package com.devlink.user_service.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupCreatedEvent {
    private Long groupId;
    private String groupName;
    private String avatarUrl;
    private List<Long> memberIds;
    private Long creatorId;
}
