package com.devlink.post_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder @Getter @AllArgsConstructor @NoArgsConstructor
public class ReportPageResponse {
    private List<ReportItemResponse> items;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}