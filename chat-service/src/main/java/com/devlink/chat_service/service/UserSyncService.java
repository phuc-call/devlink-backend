package com.devlink.chat_service.service;

import com.devlink.chat_service.dto.reponse.UserResponse;
import com.devlink.chat_service.entity.User;

public interface UserSyncService {
    
    /**
     * Ensures that the user exists in the local chat_db.
     * If not, fetches the user info from user-service via FeignClient and saves it.
     */
    User getOrSyncUser(Long userId);

    UserResponse getUserResponse(Long userId);

    void syncAllUsers();
}
