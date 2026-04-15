package com.devlink.user_service.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder @Getter
@NoArgsConstructor @AllArgsConstructor
public class FollowRequestModeResponse {
    private Boolean followRequestMode;
    private int pendingRequestsAccepted;
}