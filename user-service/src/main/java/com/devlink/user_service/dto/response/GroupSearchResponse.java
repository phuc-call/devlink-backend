package com.devlink.user_service.dto.response;

import com.devlink.user_service.entity.enums.GroupRole;
import com.devlink.user_service.entity.enums.MemberStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupSearchResponse {
    private Long id;
    private String name;
    private String description;
    private String coverImage;
    private Integer memberCount;
    private List<UserSearchResponse> mutualFriends;
    private MemberStatus joinStatus;
    private GroupRole role;
}
