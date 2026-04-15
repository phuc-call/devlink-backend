package com.devlink.user_service.service;

public interface UserBlockService {
     boolean checkIfUserIsBlocked(Long a, Long b);
     void blockUser(Long userId);
     void unBlockUser(Long userId);


}
