package com.devlink.post_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class AskAIRequest {

    @NotBlank(message = "Câu hỏi không được để trống")
    @Size(max = 1000, message = "Câu hỏi không được vượt quá 1000 ký tự")
    private String question;

    @Size(max = 3000, message = "Đoạn code context không được vượt quá 3000 ký tự")
    private String contextCode;
}
