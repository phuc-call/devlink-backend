package com.devlink.chat_service.dto.reponse;

import com.devlink.chat_service.entity.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaFileResponse {
    private Long id;
    private String fileUrl;
    private String thumbnailUrl;
    private MediaType mediaType;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private LocalDateTime createdAt;
    private Long fileSize;
}
