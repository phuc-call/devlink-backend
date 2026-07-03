package com.devlink.user_service.dto.response;

import com.devlink.user_service.entity.enums.GroupRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMemberResponse {
    private Long id;
    private String name;
    private String avatar;
    private GroupRole role;
    private LocalDateTime joinedAt;
}
