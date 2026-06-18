package com.devlink.post_service.dto.procedure;

import com.devlink.post_service.entity.enums.ReactionType;

public interface ReactionCountProjection {
    ReactionType getReactionType();
    Long getCount();
}
