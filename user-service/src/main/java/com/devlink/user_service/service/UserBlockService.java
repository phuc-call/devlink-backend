package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.BlockStatusResponse;

public interface UserBlockService {
      BlockStatusResponse blockUser(Long userId);
     boolean checkIfUserIsBlocked(Long a, Long b);
}
