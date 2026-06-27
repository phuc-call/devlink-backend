package com.devlink.user_service.dto.response;

import com.devlink.user_service.entity.enums.BadgeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeHistoryItemResponse {
    private BadgeType badgeType;
    private String grantedBy;
    private String reason;
    private Long followerCountSnapshot;
    private LocalDateTime createdAt;
}