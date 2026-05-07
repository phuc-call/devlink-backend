package com.devlink.user_service.controller;

import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserBlockController {
    private final UserBlockService userBlockService;

    @PostMapping("/me/block/{userId}")
    public ResponseEntity<ApiResponse<Void>> blockUser(@PathVariable Long userId) {
        userBlockService.blockUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "User blocked successfully"));
    }

    @DeleteMapping("/me/block/{userId}")
    public ResponseEntity<ApiResponse<Void>> unblockUser(@PathVariable Long userId) {
        userBlockService.unBlockUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "User unblocked successfully"));
    }
}