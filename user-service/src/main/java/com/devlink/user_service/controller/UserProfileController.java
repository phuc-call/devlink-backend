package com.devlink.user_service.controller;

import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.dto.reponse.FollowRequestModeResponse;
import com.devlink.user_service.dto.reponse.UserProfileResponse;
import com.devlink.user_service.dto.request.ClearProfileFieldsRequest;
import com.devlink.user_service.dto.request.UpdateNudgeConfigRequest;
import com.devlink.user_service.dto.request.UpdateProfileRequest;
import com.devlink.user_service.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserProfileController {
    private final UserProfileService userProfileService;

    @GetMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile() {
        UserProfileResponse response = userProfileService.getProfile();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @RequestBody @Valid UpdateProfileRequest request) {

        return ResponseEntity.ok(ApiResponse.ok(userProfileService.updateUserProfile(request),
                "Update success"));
    }

    @PatchMapping("/me/profile/clear")
    public ResponseEntity<ApiResponse<Void>> clearProfileFields(
            @RequestBody @Valid ClearProfileFieldsRequest request) {

        userProfileService.clearProfileFields(request);

        return ResponseEntity.ok(
                ApiResponse.ok(null, "Clear profile fields success")
        );
    }

    @PatchMapping("/me/profile/nudge-dismiss")
    public ResponseEntity<ApiResponse<Void>> dismissNudge(@RequestParam(defaultValue = "false") boolean forever) {
        userProfileService.dismissNudge(forever);
        return ResponseEntity.ok(ApiResponse.ok(null, "Dismiss nudge success"));
    }

    @PutMapping("/admin/nudge-config")
    public ResponseEntity<ApiResponse<Void>> updateNudgeConfig(@RequestBody @Valid UpdateNudgeConfigRequest request) {
        userProfileService.updateNudgeConfig(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Update nudge config success"));
    }

    @PatchMapping("/me/follow-request-mode")
    public ResponseEntity<ApiResponse<FollowRequestModeResponse>> updateFollowRequestMode(@RequestParam boolean enabled) {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.updateFollowRequestMode(enabled)));
    }

    @GetMapping("/profiles/{id}")
    public ResponseEntity<ApiResponse<UserProfileResponse>>getUserProfile(@PathVariable Long id){
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getUserProfile(id)));
    }

}
