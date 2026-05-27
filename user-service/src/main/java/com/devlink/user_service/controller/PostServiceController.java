package com.devlink.user_service.controller;

import com.devlink.user_service.dto.internal.UserInfoForCommentResponse;
import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.dto.reponse.UserFeedInfoResponse;
import com.devlink.user_service.service.FollowService;
import com.devlink.user_service.service.PostServiceClient;
import com.devlink.user_service.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class PostServiceController {

    private final FollowService followService;
    private final UserBlockService userBlockService;
    private final PostServiceClient postServiceClient;

    @GetMapping("/me/friends/ids")
    public ResponseEntity<ApiResponse<List<Long>>> getFriendIds(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(
                ApiResponse.ok(followService.getFriendIds(userId), "Success")
        );
    }

    @GetMapping("/me/blocked/ids")
    public ResponseEntity<ApiResponse<List<Long>>> getBlockedIds(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(
                ApiResponse.ok(userBlockService.getBlockedAndBlockerIds(userId), "Success")
        );
    }

    @PostMapping("/feed-info")
    public ResponseEntity<ApiResponse<Map<Long, UserFeedInfoResponse>>> getUserFeedInfo(
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestBody List<Long> userIds) {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        postServiceClient.getUserFeedInfo(userIds, currentUserId), "Success")
        );
    }

    @PostMapping("/basic-info")
    public ApiResponse<Map<Long, UserInfoForCommentResponse>> getUserBasicInfo(
            @RequestBody List<Long> userIds
    ) {
        return ApiResponse.<Map<Long, UserInfoForCommentResponse>>builder()
                .success(true)
                .data(postServiceClient.getUserBasicInfo(userIds))
                .build();
    }
}