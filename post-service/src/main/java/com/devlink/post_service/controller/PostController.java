package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.CreatePostRequest;
import com.devlink.post_service.dto.request.UpdatePostRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.PostResponse;
import com.devlink.post_service.service.PostService;
import jakarta.validation.constraints.Max;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
                        "Bài viết đã được tạo và đang chờ kiểm duyệt"));
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<Page<FeedPostResponse>>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") @Max(40) int size,
            @RequestParam(required = false) String postType) {
        return ResponseEntity.ok(
                ApiResponse.ok(postService.getFeed(page, size, postType), "Success")
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

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ApiResponse.<Void>builder()
                .message("Xoá bài viết thành công")
                .build();
    }
}