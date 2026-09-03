package com.devlink.chat_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
public class SendMessageRequest {

    @NotNull(message = "conversationId is required")
    private Long conversationId;
    private String content;
    private List<MultipartFile> files;
}
