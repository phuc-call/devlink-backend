package com.devlink.user_service.controller;

import com.devlink.user_service.dto.response.*;
import com.devlink.user_service.dto.request.UpdateNudgeConfigRequest;
import com.devlink.user_service.dto.request.UpdateProfileRequest;
import com.devlink.user_service.dto.internal.LanguageInternal;
import com.devlink.user_service.dto.internal.UserNameInternal;
import com.devlink.user_service.service.PostServiceClient;
import com.devlink.user_service.service.UserProfileService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static com.devlink.user_service.config.Constants.*;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserProfileController {
    private final UserProfileService userProfileService;
    private final PostServiceClient postServiceClient;

    @GetMapping("/{userId}/name")
    public ResponseEntity<ApiResponse<UserNameInternal>> getUserNameById(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(postServiceClient.getCurrentUser(userId)));
    }

    @GetMapping("/languages")
    public ResponseEntity<ApiResponse<LanguageInternal>> getLanguages() {
        return ResponseEntity.ok(ApiResponse.ok(postServiceClient.getListLange()));
    }

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

    @PostMapping(value = "/me/profile/avatar", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<String>> updateAvatar(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.updateAvatar(file), "Update avatar success"));
    }

    @PostMapping(value = "/me/profile/cover", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<String>> updateCoverImage(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.updateCoverImage(file), "Update cover image success"));
    }

    @PatchMapping("/me/profile/nudge-dismiss")
    public ResponseEntity<ApiResponse<Void>> dismissNudge(@RequestParam(defaultValue = DEFAULT_BOOLEAN_FALSE) boolean forever) {
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
            @RequestParam(required = false) String address,
            @RequestParam(defaultValue = DEFAULT_BOOLEAN_FALSE) Boolean friendsOnly,
            @RequestParam(defaultValue = DEFAULT_BOOLEAN_FALSE) Boolean followersOnly,
            @RequestParam(defaultValue = DEFAULT_BOOLEAN_FALSE) Boolean followingOnly,
            @RequestParam(defaultValue = DEFAULT_PAGE) @Min(0) int page,
            @RequestParam(defaultValue = DEFAULT_PAGE_SIZE) @Min(1) @Max(50) int size
    ) {
        UserSearchPageResponse result = userProfileService.search(
                name, city, address, friendsOnly, followersOnly, followingOnly, page, size
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/provinces")
    public ResponseEntity<ApiResponse<List<String>>> getProvinces() {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getProvinces()));
    }

    @GetMapping("/{id}/avatar")
    public ResponseEntity<ApiResponse<String>> getAvatarUrl(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getAvatarUrl(id)));
    }

    @GetMapping("/{id}/cover")
    public ResponseEntity<ApiResponse<String>> getCoverImageUrl(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getCoverImageUrl(id)));
    }
}
