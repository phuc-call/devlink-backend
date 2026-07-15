package com.devlink.user_service.dto.response;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WsEvent {
    private String eventType;
    private Object payload;
}
