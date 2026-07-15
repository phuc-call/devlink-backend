package com.devlink.user_service.controller;

import com.devlink.user_service.dto.response.ApiResponse;
import com.devlink.user_service.dto.response.BlockStatusResponse;
import com.devlink.user_service.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserBlockController {
    private final UserBlockService userBlockService;

    @PostMapping("/{userId}/block")
    public ResponseEntity<ApiResponse<BlockStatusResponse>> toggleBlock(@PathVariable Long userId) {
        BlockStatusResponse result = userBlockService.blockUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(result, result.getMessage()));
    }

    @GetMapping("/{userId}/block-status")
    public ResponseEntity<ApiResponse<BlockStatusResponse>> getBlockStatus(@PathVariable Long userId) {
        BlockStatusResponse result = userBlockService.getBlockStatus(userId);
        return ResponseEntity.ok(ApiResponse.ok(result, "Success"));
    }
}