package com.devlink.user_service.dto.reponse;

import com.devlink.user_service.entity.enums.FollowStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FollowQualifiedResponse {
    private FollowStatus status;
    private Integer completionPercent;
}
