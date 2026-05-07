package com.devlink.user_service.controller;

import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.dto.reponse.FollowResponse;
import com.devlink.user_service.dto.reponse.PageResponse;
import com.devlink.user_service.entity.enums.FollowActionResult;
import com.devlink.user_service.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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


    @DeleteMapping("/{userId}/follow/cancel")
    public ResponseEntity<ApiResponse<Object>> cancelFollowRequest(@PathVariable Long userId) {
        followService.cancelFollowRequest(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Success"));
    }

    @GetMapping("/me/followers")
    public ResponseEntity<ApiResponse<PageResponse<FollowResponse>>> getFollowers(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return ResponseEntity.ok(ApiResponse.ok(followService.getFollowers(page, size), "Success"));
    }


    @GetMapping("/me/following")
    public ResponseEntity<ApiResponse<PageResponse<FollowResponse>>> getFollowing(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return ResponseEntity.ok(ApiResponse.ok(followService.getFollowing(page, size), "Success"));
    }


    @PostMapping("/{userId}/view")
    public ResponseEntity<ApiResponse<Object>> incrementViewCount(@PathVariable Long userId) {
        followService.incrementViewCount(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Success"));
    }
}
