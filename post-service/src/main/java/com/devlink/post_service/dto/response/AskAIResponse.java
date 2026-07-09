package com.devlink.post_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AskAIResponse {
    private String answer;
    private String model;
    private Long templateId;
}
