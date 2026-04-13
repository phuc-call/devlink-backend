package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.UserRecommendationResponse;

import java.util.List;

public interface UserRelationshipService {
    public List<UserRecommendationResponse> getRecommendations();
}
