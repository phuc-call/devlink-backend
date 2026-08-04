package com.devlink.post_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopViolatorResponse {
    private Long userId;
    private String userName;
    private String avatarUrl;
    private long violationCount;
}
