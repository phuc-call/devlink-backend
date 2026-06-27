package com.devlink.user_service.controller;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.response.ApiResponse;
import com.devlink.user_service.dto.response.BlockStatusResponse;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserBlockController {
    private final UserBlockService userBlockService;
    private final UserHelper userHelper;

    @PostMapping("/{userId}/block")
    public ResponseEntity<ApiResponse<BlockStatusResponse>> toggleBlock(@PathVariable Long userId) {
        BlockStatusResponse result = userBlockService.blockUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(result, result.getMessage()));
    }

    @GetMapping("/{userId}/block-status")
    public ResponseEntity<BlockStatusResponse> getBlockStatus(@PathVariable Long userId) {
        User user = userHelper.getCurrentUser();
        boolean isBlocked = userBlockService.checkIfUserIsBlocked(user.getId(),userId);
        return ResponseEntity.ok(
                BlockStatusResponse.builder().blocked(isBlocked).build()
        );
    }
}