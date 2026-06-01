package com.devlink.post_service.client;

import com.devlink.post_service.config.FeignClientConfig;
import com.devlink.post_service.dto.client.UserFeedInfoClient;
import com.devlink.post_service.dto.client.UserInfoForCommentClient;
import com.devlink.post_service.dto.client.UserLanguagesClient;
import com.devlink.post_service.dto.client.UserNameClient;
import com.devlink.post_service.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
    ApiResponse<Map<Long, UserFeedInfoClient>> getUserFeedInfo(
            @RequestBody List<Long> userIds
    );
    @PostMapping("/internal/users/basic-info")
    ApiResponse<Map<Long, UserInfoForCommentClient>> getUserBasicInfo(
            @RequestBody List<Long> userIds
    );

    /**
     * Fetches the full name of a single user by their ID.
     * Used to resolve the mentioned name when a reply targets another user.
     *
     * @param userId ID of the user
     * @return UserNameInternal containing the full name
     */
    @GetMapping("/internal/users/{userId}/name")
    ApiResponse<UserNameClient> getUserNameById(@PathVariable("userId") Long userId);

    @GetMapping("/internal/users/languages")
    ApiResponse<UserLanguagesClient> getSupportedLanguages();

    @GetMapping("/internal/users/languages/me/{userId}")
    ApiResponse<List<String>> getLanguageOfCurrentUser(@PathVariable("userId") Long userId);
}