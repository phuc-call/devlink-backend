package com.devlink.user_service.controller;

import com.devlink.user_service.dto.internal.LanguageInternal;
import com.devlink.user_service.dto.internal.UserInfoForCommentInternal;
import com.devlink.user_service.dto.internal.UserNameInternal;
import com.devlink.user_service.dto.response.ApiResponse;
import com.devlink.user_service.dto.response.UserFeedInfoResponse;
import com.devlink.user_service.entity.enums.BadgeType;
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
                                ApiResponse.ok(followService.getFriendIds(userId), "Success"));
        }

        @GetMapping("/me/blocked/ids")
        public ResponseEntity<ApiResponse<List<Long>>> getBlockedIds(
                        @RequestHeader("X-User-Id") Long userId) {
                return ResponseEntity.ok(
                                ApiResponse.ok(userBlockService.getBlockedAndBlockerIds(userId), "Success"));
        }

        @PostMapping("/feed-info")
        public ResponseEntity<ApiResponse<Map<Long, UserFeedInfoResponse>>> getUserFeedInfo(
                        @RequestHeader("X-User-Id") Long currentUserId,
                        @RequestBody List<Long> userIds) {
                return ResponseEntity.ok(
                                ApiResponse.ok(
                                                postServiceClient.getUserFeedInfo(userIds, currentUserId), "Success"));
        }

        @PostMapping("/basic-info")
        public ApiResponse<Map<Long, UserInfoForCommentInternal>> getUserBasicInfo(
                        @RequestBody List<Long> userIds) {
                return ApiResponse.<Map<Long, UserInfoForCommentInternal>>builder()
                                .success(true)
                                .data(postServiceClient.getUserBasicInfo(userIds))
                                .build();
        }

        @GetMapping("/{userId}/name")
        public ApiResponse<UserNameInternal> getUserNameById(@PathVariable Long userId) {
                return ApiResponse.<UserNameInternal>builder()
                                .success(true)
                                .data(postServiceClient.getCurrentUser(userId))
                                .build();
        }

        @GetMapping("/languages")
        public ApiResponse<LanguageInternal> getLanguages() {
                return ApiResponse.<LanguageInternal>builder()
                                .success(true)
                                .data(postServiceClient.getListLange())
                                .build();
        }

        @GetMapping("/languages/me/{userId}")
        public ApiResponse<List<String>> getLanguageOfCurrentUser(
                        @PathVariable Long userId) {
                return ApiResponse.<List<String>>builder()
                                .success(true)
                                .data(postServiceClient.getLanguageOfCurrentUser(userId))
                                .build();
        }

        @GetMapping("/{id}/following/ids")
        public ResponseEntity<ApiResponse<List<Long>>> getFollowingIds(
                        @PathVariable Long id) {
                return ResponseEntity.ok(
                                ApiResponse.<List<Long>>builder()
                                                .success(true)
                                                .message("Success")
                                                .data(postServiceClient.getFollowingId(id))
                                                .build());
        }

        @GetMapping("/users/{userId}")
        public ResponseEntity<ApiResponse<Map<Long, BadgeType>>> getUserBadge(
                        @PathVariable Long userId) {
                Map<Long, BadgeType> result = postServiceClient.getUserBadge(userId);
                return ResponseEntity.ok(ApiResponse.<Map<Long, BadgeType>>builder()
                                .success(true)
                                .message("Success")
                                .data(result)
                                .build());
        }

}