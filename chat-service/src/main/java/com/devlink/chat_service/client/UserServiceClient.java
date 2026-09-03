package com.devlink.chat_service.client;

import com.devlink.chat_service.dto.reponse.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;
import java.util.Map;
import com.devlink.chat_service.dto.client.UserInfoClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.devlink.chat_service.config.FeignClientConfig;

@FeignClient(name = "user-service", configuration = FeignClientConfig.class)
public interface UserServiceClient {

    @GetMapping("/internal/users/me/friends/ids")
    ApiResponse<List<Long>> getFriendIds(@RequestHeader("X-User-Id") Long userId);

    @GetMapping("/internal/users/me/blocked/ids")
    ApiResponse<List<Long>> getBlockedIds(@RequestHeader("X-User-Id") Long userId);

    @GetMapping("/internal/users/block-check")
    ApiResponse<Boolean> isBlockedBetween(@RequestParam("userId") Long userId,
                                          @RequestParam("targetId") Long targetId);

    @PostMapping("/internal/users/basic-info")
    ApiResponse<Map<Long, UserInfoClient>> getUserBasicInfo(@RequestBody List<Long> userIds);

    @GetMapping("/internal/users/all-basic-info")
    ApiResponse<List<UserInfoClient>> getAllUsersBasicInfo();
}
