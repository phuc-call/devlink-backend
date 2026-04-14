package com.devlink.user_service.service;

public interface FollowService {
  void followUser(Long userId);
  void unFollowUser(Long userId);
}
