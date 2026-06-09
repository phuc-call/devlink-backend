package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.CreatePostRequest;
import com.devlink.post_service.dto.request.UpdatePostRequest;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.PostResponse;
import org.springframework.data.domain.Page;

public interface PostService {
    PostResponse createPost(CreatePostRequest request);
    Page<FeedPostResponse> getFeed(int page, int size, String postType);

    PostResponse updatePost(Long postId, UpdatePostRequest request);
    void deletePost(Long postId);
}
