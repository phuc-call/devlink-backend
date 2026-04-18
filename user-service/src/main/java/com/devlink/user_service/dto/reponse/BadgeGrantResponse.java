package com.devlink.user_service.dto.reponse;

import com.devlink.user_service.entity.enums.BadgeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class BadgeGrantResponse {
    private Long          userId;
    private BadgeType     badge;
    private String        message;
    private LocalDateTime grantedAt;
}