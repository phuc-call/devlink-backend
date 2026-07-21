package com.devlink.user_service.service;

import com.devlink.user_service.dto.response.PageResponse;
import com.devlink.user_service.dto.response.UserRecommendationResponse;

public interface UserRelationshipService {
    PageResponse<UserRecommendationResponse> getRecommendations(int page, int size);
    PageResponse<UserRecommendationResponse> getSpecialRecommendations(int page, int size);
}
