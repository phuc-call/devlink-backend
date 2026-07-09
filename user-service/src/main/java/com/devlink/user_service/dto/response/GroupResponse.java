package com.devlink.user_service.dto.response;

import com.devlink.user_service.entity.enums.GroupPrivacy;
import com.devlink.user_service.entity.enums.GroupRole;
import com.devlink.user_service.entity.enums.MemberStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupResponse {
    private Long id;
    private String name;
    private String description;
    private String coverImage;
    private GroupPrivacy privacy;
    private Integer memberCount;
    private String inviteCode;
    private LocalDateTime createdAt;
    private MemberStatus joinStatus;
    private GroupRole role;
}
