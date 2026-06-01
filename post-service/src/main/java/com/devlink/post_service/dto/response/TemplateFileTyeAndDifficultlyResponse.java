package com.devlink.post_service.dto.response;

import lombok.*;

import java.util.List;
@Builder @Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class TemplateFileTyeAndDifficultlyResponse {
    private List<String> difficultly;
    private List<String> fileType;
}
