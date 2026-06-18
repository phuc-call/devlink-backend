package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.ReactionType;
import com.devlink.post_service.entity.enums.TargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionResponse {

    private ReactionType currentUserReaction;

    private Long targetId;
    private TargetType targetType;

    //each type for targetType
    private Map<ReactionType, Long> counts;


    private long totalCount;
}
