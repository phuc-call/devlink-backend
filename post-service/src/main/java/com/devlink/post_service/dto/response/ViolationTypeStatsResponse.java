package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.TargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationTypeStatsResponse {
    private TargetType targetType;
    private long totalViolations;
    private long uniqueViolators;
    private List<TopViolatorResponse> topViolators;
}
