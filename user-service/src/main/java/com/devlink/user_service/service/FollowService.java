package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.FollowResponse;
import com.devlink.user_service.dto.reponse.PageResponse;
import com.devlink.user_service.entity.enums.FollowActionResult;
import com.devlink.user_service.entity.enums.FollowListType;

public interface FollowService {
  void followUser(Long userId);
  void unFollowUser(Long userId);
  void incrementViewCount( Long followingId);
  public PageResponse<FollowResponse> getFollowList(FollowListType type, Integer pageNumber, Integer pageSize);


  void cancelFollowRequest( Long followingId);
  public FollowActionResult getFollowStatus(Long userId);
}
