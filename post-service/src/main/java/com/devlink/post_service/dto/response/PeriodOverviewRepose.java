package com.devlink.post_service.dto.response;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@AllArgsConstructor @NoArgsConstructor
public class PeriodOverviewRepose {
    private String from;
    private String to;
    private List<DatePointResponse> data;
}