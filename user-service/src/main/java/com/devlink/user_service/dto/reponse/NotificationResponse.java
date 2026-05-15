package com.devlink.user_service.dto.reponse;

import com.devlink.user_service.entity.enums.NotificationType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private Long actorId;
    private String actorName;    // tên người tạo thông báo
    private String actorAvatar;
    private NotificationType type;
    private String content;
    private Boolean isRead;
    private LocalDateTime createdAt;
}