package com.devlink.user_service.controller;

import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.dto.reponse.FollowResponse;
import com.devlink.user_service.dto.reponse.PageResponse;
import com.devlink.user_service.dto.reponse.UserFollowingCardResponse;
import com.devlink.user_service.entity.enums.FollowActionResult;
import com.devlink.user_service.entity.enums.FollowListType;
import com.devlink.user_service.service.FollowService;
import com.devlink.user_service.service.UserProfileService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class FollowController {
    private final FollowService followService;

    private final UserProfileService userProfileService;
    @PostMapping("/{userId}/follow")
    public ResponseEntity<ApiResponse<Object>>followUser(@PathVariable Long userId){
        followService.followUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(null,"Success"));
    }

    @GetMapping("/{userId}/follow")
    public ResponseEntity<ApiResponse<FollowActionResult>>getFollowStatus(@PathVariable Long userId){
        return ResponseEntity.ok(ApiResponse.ok(followService.getFollowStatus(userId),"Success"));
    }


    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<ApiResponse<Object>> unFollowUser(@PathVariable Long userId) {
        followService.unFollowUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Success"));
    }
    @GetMapping("/me/following/cards")
    public ResponseEntity<ApiResponse<Page<UserFollowingCardResponse>>> getFollowingCards(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(followService.getFollowingCards(page, size)));
    }

    @DeleteMapping("/{userId}/follow/cancel")
    public ResponseEntity<ApiResponse<Object>> cancelFollowRequest(@PathVariable Long userId) {
        followService.cancelFollowRequest(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Success"));
    }

    @GetMapping("/me/follows")
    public ResponseEntity<ApiResponse<PageResponse<FollowResponse>>> getFollowList(
            @RequestParam FollowListType type,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return ResponseEntity.ok(ApiResponse.ok(followService.getFollowList(type, page, size), "Success"));
    }


    @PostMapping("/{userId}/view")
    public ResponseEntity<ApiResponse<Object>> incrementViewCount(@PathVariable Long userId) {
        followService.incrementViewCount(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Success"));
    }
}
