package com.devlink.user_service.controller;

import com.devlink.user_service.dto.reponse.*;
import com.devlink.user_service.dto.request.UpdateNudgeConfigRequest;
import com.devlink.user_service.dto.request.UpdateProfileRequest;
import com.devlink.user_service.service.UserProfileService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/me/follow-request-mode")
    public ResponseEntity<ApiResponse<FollowRequestModeResponse>> getFollowRequestMode() {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getFollowRequestMode()));
    }

    @GetMapping("/profiles/{id}")
    public ResponseEntity<ApiResponse<UserProfileResponse>>getUserProfile(@PathVariable Long id){
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getUserProfile(id)));
    }

    @GetMapping("/me/visibility-setting")
    public ResponseEntity<ApiResponse<VisibilitySettingResponse>> getVisibilitySetting() {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getVisibilitySetting()));
    }

    @PatchMapping("/me/visibility-setting")
    public ResponseEntity<ApiResponse<Void>> updateVisibilitySetting(@RequestParam String visibility) {
        userProfileService.updateVisibilitySetting(visibility);
        return ResponseEntity.ok(ApiResponse.ok(null, "Update visibility setting success"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<UserSearchPageResponse>> search(
            @RequestParam @NotBlank String name,
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "false") Boolean friendsOnly,
            @RequestParam(defaultValue = "false") Boolean followersOnly,
            @RequestParam(defaultValue = "false") Boolean followingOnly,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size
    ) {
        UserSearchPageResponse result = userProfileService.search(
                name, city, friendsOnly, followersOnly, followingOnly, page, size
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/provinces")
    public ResponseEntity<ApiResponse<List<String>>> getProvinces() {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getProvinces()));
    }
}
