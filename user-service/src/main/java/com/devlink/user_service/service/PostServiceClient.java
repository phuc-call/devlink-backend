package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.UserFeedInfoResponse;

import java.util.List;
import java.util.Map;

public interface PostServiceClient {
     Map<Long, UserFeedInfoResponse> getUserFeedInfo(List<java.lang.Long> userIds, java.lang.Long currentUserId);
}
