package com.devlink.user_service.dto.reponse;

import com.devlink.user_service.entity.enums.FollowStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor @Getter @NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FollowResponse {
    private Long userId;
    private String fullName;
    private String avatar;
    private FollowStatus status;
    @JsonIgnore
    private boolean isFriend;
}
