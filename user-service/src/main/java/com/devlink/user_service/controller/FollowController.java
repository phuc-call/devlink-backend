package com.devlink.user_service.controller;

import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class FollowController {
    private final FollowService followService;
    @PostMapping("/{user_id}/follow")
    public ResponseEntity<ApiResponse<Object>>followUser(@PathVariable Long user_id){
        followService.followUser(user_id);
        return ResponseEntity.ok(ApiResponse.ok(null,"Success"));
    }
}
