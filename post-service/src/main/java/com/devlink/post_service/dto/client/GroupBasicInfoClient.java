package com.devlink.post_service.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupBasicInfoClient {
    private Long id;
    private String name;
    private String coverImage;
    private String privacy;
}
