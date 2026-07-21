package com.devlink.user_service.controller;

import com.devlink.user_service.dto.response.ApiResponse;
import com.devlink.user_service.dto.response.PageResponse;
import com.devlink.user_service.dto.response.UserRecommendationResponse;
import com.devlink.user_service.service.UserRelationshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserRelationShipController {
    private final UserRelationshipService userRelationshipService;
    
    @GetMapping("/me/normal/recommendation")
    public ResponseEntity<ApiResponse<PageResponse<UserRecommendationResponse>>> getNormalRecommendation(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(ApiResponse.ok(userRelationshipService.getRecommendations(page, size), "Success"));
    }
    
    @GetMapping("/me/special/recommendation")
    public ResponseEntity<ApiResponse<PageResponse<UserRecommendationResponse>>> getSpecialRecommendation(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(ApiResponse.ok(userRelationshipService.getSpecialRecommendations(page, size), "Success"));
    }
}
