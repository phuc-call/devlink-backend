package com.devlink.user_service.dto.response;

import lombok.Builder;
import lombok.Getter;

@Builder @Getter
public class BlockStatusResponse {
    private boolean blocked;
    private String message;
}
