package com.devlink.post_service.controller;

import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.request.CreatePostRequest;
import com.devlink.post_service.dto.request.UpdatePostRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.PostResponse;
import com.devlink.post_service.service.PostService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.devlink.post_service.config.Constants.SUCCESS;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {

    private final PostService postService;


    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @ModelAttribute CreatePostRequest request
    ) {

        PostResponse response = postService.createPost(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response,
                        Constants.SUCCESS));
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<Page<FeedPostResponse>>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "4") @Max(20) int size,
            @RequestParam(required = false) String postType) {
        int safeSize = Math.min(size, 20);
        return ResponseEntity.ok(
                ApiResponse.ok(postService.getFeed(page, safeSize, postType), SUCCESS)
        );
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable Long id,
            @ModelAttribute UpdatePostRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(postService.updatePost(id, request), "Update post successfully")
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FeedPostResponse>> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getPostById(id), SUCCESS));
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<ApiResponse<PostResponse>> sharePost(
            @PathVariable Long id,
            @RequestParam(required = false) String content) {
        return ResponseEntity.ok(ApiResponse.ok(postService.sharePost(id, content), SUCCESS));
    }
    @GetMapping("/following")
    public ResponseEntity<ApiResponse<Page<FeedPostResponse>>> getFollowingFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "3") @Max(20) int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(postService.getFollowingFeed(page, size), SUCCESS)
        );
    }

    @GetMapping("/feed/friends")
    public ResponseEntity<ApiResponse<Page<FeedPostResponse>>> getFriendsFeed(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "3") @Min(1) @Max(20) int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(postService.getFriendsFeed(page, size), SUCCESS)
        );
    }

    @GetMapping("/feed/groups")
    public ResponseEntity<ApiResponse<Page<FeedPostResponse>>> getGroupsFeed(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "3") @Min(1) @Max(20) int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(postService.getGroupsFeed(page, size), SUCCESS)
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ApiResponse.<Void>builder()
                .message("Deleted a post successfully")
                .build();
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Page<FeedPostResponse>>> getUserPosts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") @Max(20) int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(postService.getUserPosts(userId, page, size), SUCCESS)
        );
    }

    @GetMapping("/groups/{groupId}")
    public ResponseEntity<ApiResponse<Page<FeedPostResponse>>> getGroupPosts(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") @Max(20) int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(postService.getGroupPosts(groupId, page, size), SUCCESS)
        );
    }

}