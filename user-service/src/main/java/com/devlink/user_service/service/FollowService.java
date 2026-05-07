package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.FollowResponse;
import com.devlink.user_service.dto.reponse.PageResponse;
import com.devlink.user_service.entity.enums.FollowActionResult;

public interface FollowService {
  void followUser(Long userId);
  void unFollowUser(Long userId);
  void incrementViewCount( Long followingId);
  PageResponse<FollowResponse> getFollowers(Integer pageNumber, Integer pageSize);

  PageResponse<FollowResponse> getFollowing(Integer pageNumber, Integer pageSize);
  void cancelFollowRequest( Long followingId);
  public FollowActionResult getFollowStatus(Long userId);
}
