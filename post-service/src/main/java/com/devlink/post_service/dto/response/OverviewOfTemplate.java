package com.devlink.post_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Builder
@Getter
@AllArgsConstructor
public class OverviewOfTemplate {
    private Long overviewHidden;
    private Long overviewAction;
    private Long overviewTemplate;
    private Long overviewFork;
    private Long overviewWatch;
    private Long overviewFileType;
    private Instant overviewOldDate;
    private Instant overviewNewDate;
    List<TemplateOverviewItemResponse> items;
    private Map<String, Long> byLanguage;
    private Map<String, Long> byFileType;
    private Map<String, Long> byDifficulty;
}
