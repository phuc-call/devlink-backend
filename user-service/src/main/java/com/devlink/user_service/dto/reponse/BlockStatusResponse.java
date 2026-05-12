package com.devlink.user_service.dto.reponse;

import lombok.Builder;
import lombok.Getter;

@Builder @Getter
public class BlockStatusResponse {
    private boolean blocked;
    private String message;
}
