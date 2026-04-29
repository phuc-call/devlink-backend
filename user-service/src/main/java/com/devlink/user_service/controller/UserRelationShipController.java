package com.devlink.user_service.controller;

import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.dto.reponse.UserRecommendationResponse;
import com.devlink.user_service.service.UserRelationshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserRelationShipController {
    private final UserRelationshipService userRelationshipService;
    @GetMapping("/me/normal/recommendation")
    public ResponseEntity<ApiResponse<List<UserRecommendationResponse>>>getNormalRecommendation(){
        return ResponseEntity.ok(ApiResponse.ok(userRelationshipService.getRecommendations(),"Success"));
    }
    @GetMapping("/me/special/recommendation")
    public ResponseEntity<ApiResponse<List<UserRecommendationResponse>>>getSpecialRecommendation(){
        return ResponseEntity.ok(ApiResponse.ok(userRelationshipService.getSpecialRecommendations(),"Success"));
    }
}
