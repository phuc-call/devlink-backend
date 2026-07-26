package com.devlink.post_service.dto.response;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProposedGroupResponse {
    private String suggestedName;
    private String suggestedKeyword;
    private List<String> tags;
    private int tagCount;
}

