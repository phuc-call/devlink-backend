package com.devlink.post_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ForkResponse {
    private Long forkId;
    private Long templateId;
    private String title;
    private Boolean isModified;
}