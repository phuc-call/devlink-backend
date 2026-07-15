package com.devlink.post_service.dto.response;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WsEvent {
    private String eventType;
    private Object payload;
}
