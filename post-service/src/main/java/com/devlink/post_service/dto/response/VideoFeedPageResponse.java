package com.devlink.post_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoFeedPageResponse {

    private List<VideoFeedResponse> content;

    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    private int priorityCount;
    private int discoveryCount;
}