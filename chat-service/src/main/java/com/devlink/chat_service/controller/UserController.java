package com.devlink.chat_service.controller;

import com.devlink.chat_service.dto.reponse.ApiResponse;
import com.devlink.chat_service.dto.reponse.UserResponse;
import com.devlink.chat_service.service.UserSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat/users")
@RequiredArgsConstructor
public class UserController {

    private final UserSyncService userSyncService;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getOrSyncUser(@PathVariable Long userId) {
        UserResponse userResponse = userSyncService.getUserResponse(userId);
        return ResponseEntity.ok(ApiResponse.ok(userResponse));
    }

    @PostMapping("/sync-all")
    public ResponseEntity<ApiResponse<String>> syncAllUsers() {
        userSyncService.syncAllUsers();
        return ResponseEntity.ok(ApiResponse.ok("Successfully synced all missing users from user-service"));
    }
}
