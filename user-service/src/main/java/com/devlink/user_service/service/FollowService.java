package com.devlink.user_service.service;

import com.devlink.user_service.dto.response.FollowResponse;
import com.devlink.user_service.dto.response.PageResponse;
import com.devlink.user_service.dto.response.UserFollowingCardResponse;
import com.devlink.user_service.entity.enums.FollowActionResult;
import com.devlink.user_service.entity.enums.FollowListType;
import org.springframework.data.domain.Page;

import java.util.List;

public interface FollowService {
  void followUser(Long userId);
  void unFollowUser(Long userId);
  void incrementViewCount( Long followingId);
  public PageResponse<FollowResponse> getFollowList(FollowListType type, Integer pageNumber, Integer pageSize);
  List<Long> getFriendIds(Long userId);

  void cancelFollowRequest( Long followingId);
   FollowActionResult getFollowStatus(Long userId);


  Page<UserFollowingCardResponse> getFollowingCards(int page, int size);
}
