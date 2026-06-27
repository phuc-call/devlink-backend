package com.devlink.user_service.service;

import com.devlink.user_service.dto.response.BlockStatusResponse;

import java.util.List;

public interface UserBlockService {
      BlockStatusResponse blockUser(Long userId);
     boolean checkIfUserIsBlocked(Long a, Long b);
    List<Long> getBlockedAndBlockerIds(Long userId);
}
