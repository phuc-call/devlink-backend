package com.devlink.post_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@AllArgsConstructor @NoArgsConstructor @Getter
public class SavePostProjectionResponse {
    private Long postId;
    private Instant saveAt;
}
