package com.devlink.user_service.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageNotificationEvent {
    private Long senderId;
    private Long receiverId;
    private String content;
    private LocalDateTime timestamp;
}