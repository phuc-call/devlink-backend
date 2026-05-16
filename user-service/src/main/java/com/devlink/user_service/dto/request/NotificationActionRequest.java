package com.devlink.user_service.dto.request;

import com.devlink.user_service.entity.enums.NotificationAction;
import lombok.*;

import java.util.List;
@Builder @AllArgsConstructor @NoArgsConstructor @Getter @Setter
public class NotificationActionRequest {
    private NotificationAction action;
    private String passWord;
    private Long id;
    private List<Long> ids;
}
