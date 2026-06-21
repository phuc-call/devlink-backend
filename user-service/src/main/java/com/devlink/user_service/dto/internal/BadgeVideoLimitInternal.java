package com.devlink.user_service.dto.internal;

import com.devlink.user_service.entity.BadgeVideoLimit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeVideoLimitInternal {

    private String badgeType;
    private Integer maxSeconds;
    private Integer maxCount;

    public static BadgeVideoLimitInternal from(BadgeVideoLimit e) {
        return BadgeVideoLimitInternal.builder()
                .badgeType(e.getBadgeType())
                .maxSeconds(e.getMaxSeconds())
                .maxCount(e.getMaxCount())
                .build();
    }

    // Map key là badgeType string: "NONE", "POPULAR"...
    public static Map<String, BadgeVideoLimitInternal> toMap(List<BadgeVideoLimit> list) {
        return list.stream().collect(Collectors.toMap(
                BadgeVideoLimit::getBadgeType,
                BadgeVideoLimitInternal::from
        ));
    }
}