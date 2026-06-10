package com.devlink.post_service.controller;

import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.service.UserSavedPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/saved")
@RequiredArgsConstructor
public class UserSavePostController {

    private final UserSavedPostService userSavedPostService;

    @PostMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> savePost(@PathVariable Long postId) {
        userSavedPostService.savePost(postId);
        return ResponseEntity.ok(ApiResponse.ok(null,"Saved to library successfully"));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> unsavePost(@PathVariable Long postId) {
        userSavedPostService.unsavePost(postId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Success removed"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<FeedPostResponse>>> getSavedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(userSavedPostService.getSavedPosts(page, size)));
    }
}