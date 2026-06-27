package com.devlink.user_service.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;


@Getter
@Builder
public class AuthTokenResponse {
    private Long userId;
    List<AuthTokenItemResponse> tokens;
}
