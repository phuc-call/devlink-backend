package com.devlink.user_service.dto.reponse;

import com.devlink.user_service.entity.enums.BadgeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBadgeDetailResponse {
    private Long userId;
    private String username;
    private String email;
    private BadgeType currentBadge;
    private List<BadgeHistoryItemResponse> history;
}