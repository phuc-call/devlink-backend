package com.devlink.user_service.controller;

import com.devlink.user_service.dto.response.ApiResponse;
import com.devlink.user_service.dto.response.FollowResponse;
import com.devlink.user_service.dto.response.PageResponse;
import com.devlink.user_service.dto.response.UserFollowingCardResponse;
import com.devlink.user_service.entity.enums.FollowActionResult;
import com.devlink.user_service.entity.enums.FollowListType;
import com.devlink.user_service.service.FollowService;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.devlink.user_service.config.Constants.DEFAULT_PAGE;
import static com.devlink.user_service.config.Constants.DEFAULT_PAGE_SIZE;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class FollowController {
    private final FollowService followService;


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
            @RequestParam(defaultValue = DEFAULT_PAGE) @Min(0) int page,
            @RequestParam(defaultValue = DEFAULT_PAGE_SIZE) @Min(1) @Max(50) int size
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
            @RequestParam(defaultValue = DEFAULT_PAGE) Integer page,
            @RequestParam(defaultValue = DEFAULT_PAGE_SIZE) Integer size) {
        return ResponseEntity.ok(ApiResponse.ok(followService.getFollowList(type, page, size), "Success"));
    }


    @PostMapping("/{userId}/view")
    public ResponseEntity<ApiResponse<Object>> incrementViewCount(@PathVariable Long userId) {
        followService.incrementViewCount(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Success"));
    }
}
