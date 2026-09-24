package com.devlink.chat_service.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

import com.devlink.chat_service.dto.reponse.MediaResponse;
import com.devlink.chat_service.dto.reponse.AttachmentResponse;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class PinMessageResponse {

    private Long id; // This is pinnedMessageId
    private Long messageId; // The original message ID
    private LocalDate createdAt;
    private String content;
    private String senderName;
    private String senderAvatar;
    private String conversationId;
    private MediaResponse media;
    private AttachmentResponse attachment;
}
