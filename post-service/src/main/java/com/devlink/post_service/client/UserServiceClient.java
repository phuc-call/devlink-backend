package com.devlink.post_service.client;

import com.devlink.post_service.config.FeignClientConfig;
import com.devlink.post_service.dto.client.UserFeedInfoResponse;
import com.devlink.post_service.dto.client.UserInfoForCommentResponse;
import com.devlink.post_service.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@Component
@FeignClient(
        name = "user-service",
        configuration = FeignClientConfig.class
)
public interface UserServiceClient {

    @GetMapping("/internal/users/me/friends/ids")
    ApiResponse<List<Long>> getFriendIds();

    @GetMapping("/internal/users/me/blocked/ids")
    ApiResponse<List<Long>> getBlockedIds();

    @PostMapping("/internal/users/feed-info")
    ApiResponse<Map<Long, UserFeedInfoResponse>> getUserFeedInfo(
            @RequestBody List<Long> userIds
    );
    @PostMapping("/internal/users/basic-info")
    ApiResponse<Map<Long, UserInfoForCommentResponse>> getUserBasicInfo(
            @RequestBody List<Long> userIds
    );
}