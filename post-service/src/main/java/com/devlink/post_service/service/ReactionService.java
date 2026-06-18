package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.ReactionRequest;
import com.devlink.post_service.dto.response.ReactionResponse;
import com.devlink.post_service.entity.enums.TargetType;

import java.util.List;

public interface ReactionService {
    /**
     * Creates, updates, or removes a user's reaction.
     *
     * - Same reaction type → remove the reaction.
     * - Different reaction type → update the reaction.
     * - No existing reaction → create a new reaction.
     *
     * @param request target ID, target type, and reaction type
     * @return updated reaction statistics and the user's current reaction
     */
    ReactionResponse react( ReactionRequest request);

    /**
     * Retrieves the reaction summary for a target (used by GET endpoints or when loading a PostCard).
     */
    ReactionResponse getSummary(Long targetId, TargetType targetType);

    /**
     * Show 3 high react type
     */

    List<String> showHighReact(Long targetId, TargetType type);


}
