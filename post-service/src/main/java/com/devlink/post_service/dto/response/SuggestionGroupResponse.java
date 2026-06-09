package com.devlink.post_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class SuggestionGroupResponse {
    private int count;
    private List<SuggestionSummary> items;
}
