package com.devlink.user_service.controller;

import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.dto.reponse.UserProfileResponse;
import com.devlink.user_service.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserProfileController {
private final UserProfileService userProfileService;
    @GetMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>>getProfile(){
        UserProfileResponse response=userProfileService.getProfile();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

}
