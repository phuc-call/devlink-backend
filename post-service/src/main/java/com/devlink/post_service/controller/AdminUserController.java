package com.devlink.post_service.controller;

import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    /** GET /api/admin/users?search=phuc&page=0&size=20 */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<AdminUserResponse>>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50), Sort.by("createdAt").descending());
        Page<AdminUserResponse> result = adminUserService.listUsers(search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result)));
    }

    /** GET /api/admin/users/overview */
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminOverviewResponse>> getOverview() {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.getOverview()));
    }

    /** GET /api/admin/users/{userId} - detailed profile */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<AdminUserDetailResponse>> getUserDetail(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.getUserDetail(userId)));
    }


    /** GET /api/admin/users/{userId}/interests?page=0&size=20 */
    @GetMapping("/{userId}/interests")
    public ResponseEntity<ApiResponse<PagedResponse<UserInterestSummaryResponse>>> getUserInterests(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50));
        Page<UserInterestSummaryResponse> result = adminUserService.getUserInterests(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result)));
    }

    /**
     * POST /api/admin/users/{userId}/interests
     * Body: { "tags": ["tintuc", "java"], "score": 10.0 }
     */
    @PostMapping("/{userId}/interests")
    public ResponseEntity<ApiResponse<Void>> addUserInterests(
            @PathVariable Long userId,
            @RequestBody AddInterestRequest request) {
        adminUserService.addUserInterests(userId, request.getTags(), request.getScore());
        return ResponseEntity.ok(ApiResponse.ok(null, "Interests added"));
    }

    /** DELETE /api/admin/users/{userId}/interests/{tag} */
    @DeleteMapping("/{userId}/interests/{tag}")
    public ResponseEntity<ApiResponse<Void>> removeUserInterest(
            @PathVariable Long userId, @PathVariable String tag) {
        adminUserService.removeUserInterest(userId, tag);
        return ResponseEntity.ok(ApiResponse.ok(null, "Interest removed"));
    }

    /** DELETE /api/admin/users/{userId}/interests — clear all */
    @DeleteMapping("/{userId}/interests")
    public ResponseEntity<ApiResponse<Void>> clearUserInterests(@PathVariable Long userId) {
        adminUserService.clearUserInterests(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "All interests cleared"));
    }


    /** GET /api/admin/users/{userId}/viewed-posts?page=0&size=10 */
    @GetMapping("/{userId}/viewed-posts")
    public ResponseEntity<ApiResponse<PagedResponse<FeedPostResponse>>> getViewedPosts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 20));
        Page<FeedPostResponse> result = adminUserService.getViewedPosts(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result)));
    }

    /** GET /api/admin/users/{userId}/viewed-images?page=0&size=20 */
    @GetMapping("/{userId}/viewed-images")
    public ResponseEntity<ApiResponse<PagedResponse<MediaResponse>>> getViewedImages(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50));
        Page<MediaResponse> result = adminUserService.getViewedImages(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result)));
    }

    /** GET /api/admin/users/{userId}/viewed-videos?page=0&size=10 */
    @GetMapping("/{userId}/viewed-videos")
    public ResponseEntity<ApiResponse<PagedResponse<MediaResponse>>> getViewedVideos(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 20));
        Page<MediaResponse> result = adminUserService.getViewedVideos(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result)));
    }

    /** GET /api/admin/users/{userId}/viewed-files?page=0&size=10 */
    @GetMapping("/{userId}/viewed-files")
    public ResponseEntity<ApiResponse<PagedResponse<MediaResponse>>> getViewedFiles(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 20));
        Page<MediaResponse> result = adminUserService.getViewedFiles(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result)));
    }

    /** GET /api/admin/users/{userId}/viewed-links?page=0&size=10 */
    @GetMapping("/{userId}/viewed-links")
    public ResponseEntity<ApiResponse<PagedResponse<PostLinkResponse>>> getViewedLinks(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 20));
        Page<PostLinkResponse> result = adminUserService.getViewedLinks(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result)));
    }

    @lombok.Getter @lombok.Setter @lombok.NoArgsConstructor @lombok.AllArgsConstructor
    public static class AddInterestRequest {
        private List<String> tags;
        private double score = 10.0;
    }
}
