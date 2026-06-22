package com.devlink.user_service.controller;

import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.dto.reponse.BadgeVideoLimitResponse;
import com.devlink.user_service.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Internal-only controller: các endpoint này CHỈ dành cho service-to-service (Feign).
 * Được bảo vệ bởi InternalAuthFilter — yêu cầu header X-Internal-Secret hợp lệ.
 * Không cần user authentication context.
 */
@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalBadgeController {

    private final BadgeService badgeService;

    /**
     * Trả về danh sách video limits theo badge type.
     * Dùng bởi post-service để kiểm tra giới hạn video khi đăng bài.
     */
    @GetMapping("/badges/video-limits")
    public ResponseEntity<ApiResponse<List<BadgeVideoLimitResponse>>> getAllBadgeVideoLimits() {
        return ResponseEntity.ok(ApiResponse.ok(badgeService.getAllBadgeVideoLimits()));
    }
}
