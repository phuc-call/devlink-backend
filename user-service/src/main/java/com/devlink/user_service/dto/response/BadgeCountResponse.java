package com.devlink.user_service.dto.response;

import com.devlink.user_service.entity.enums.BadgeType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class BadgeCountResponse {
    private BadgeType badge;
    private Long total;
}